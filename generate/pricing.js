const fs = require("fs");
const GlobalCatalogV1 = require("@ibm-cloud/platform-services/global-catalog/v1");

async function retrieveAll() {
  const globalCatalog = GlobalCatalogV1.newInstance({
    authenticator: {
      authenticate: () => {
        return Promise.resolve({});
      },
    },
  });

  function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  async function fetchAndRetryIfNecessary(callAPIFn) {
    try {
      const response = await callAPIFn();
      return response;
    } catch (error) {
      if (error.status === 429) {
        console.log("throttle in action...");
        await sleep(30000);
        return fetchAndRetryIfNecessary(callAPIFn);
      } else if (error.status === 404) {
        console.log("no pricing for", result.message);
        throw error;
      } else {
        console.log(error);
        throw error;
      }
    }
  }

  async function populateEntries(entries) {
    for (const entry of entries) {
      console.log(entry.id);
      const children = (
        await fetchAndRetryIfNecessary(() =>
          globalCatalog.getChildObjects({
            id: entry.id,
            kind: "*",
            limit: 5000,
            complete: true,
          })
        )
      ).result.resources;

      entry["__children"] = children;

      try {
        const pricing = (
          await fetchAndRetryIfNecessary(() =>
            globalCatalog.getPricing({
              id: entry.id,
            })
          )
        ).result;
        entry.__pricing = pricing;
      } catch (err) {
        // console.log(err);
      }

      await populateEntries(entry.__children);
    }
  }

  const roots = (
    await globalCatalog.listCatalogEntries({
      complete: true,
      q: "kind:iaas kind:service",
      limit: 5000,
    })
  ).result.resources;
  await populateEntries(roots);

  return roots;
}

function dumpPrices(entries) {
  let rows = [];
  for (const entry of entries) {
    const pricing = entry.__pricing;
    if (pricing && pricing.metrics) {
      console.log(entry.id);

      const pricingColumns = {
        id: entry.id,
        deployment_id: pricing.deployment_id,
      };

      for (const metric of entry.__pricing.metrics) {
        const metricColumns = {
          ...pricingColumns,
          metric_id: metric.metric_id,
          metric_tier_model: metric.tier_model,
          metric_charge_unit: metric.charge_unit,
        };

        if (!metric.amounts) {
          console.error("no amounts for", entry.id, metric.metric_id);
          continue;
        }

        for (const amount of metric.amounts) {
          const amountColumns = {
            ...metricColumns,
            amount_country: amount.country,
            amount_currency: amount.currency,
          };

          for (const price of amount.prices) {
            const priceColumns = {
              ...amountColumns,
              price_quantity_tier: price.quantity_tier,
              price_price: price.price,
            };

            rows.push(priceColumns);
          }
        }
      }
    }
    if (entry.__children) {
      rows = rows.concat(dumpPrices(entry.__children, rows));
    }
  }
  return rows;
}

(async () => {
  // get entries
  {
    const entries = await retrieveAll();
    fs.writeFileSync(
      "../docs/generated/pricing.json",
      JSON.stringify(entries, null, 2)
    );
  }

  // export to csv
  {
    const entries = JSON.parse(
      fs.readFileSync("../docs/generated/pricing.json")
    );
    const createCsvWriter = require("csv-writer").createObjectCsvWriter;
    const csvWriter = createCsvWriter({
      path: "../docs/generated/pricing.csv",
      header: [
        { id: "id", title: "ID" },
        { id: "deployment_id", title: "Deployment ID" },
        { id: "metric_id", title: "Metric ID" },
        { id: "metric_tier_model", title: "Tier Model" },
        { id: "metric_charge_unit", title: "Charge Unit" },
        { id: "amount_country", title: "Country" },
        { id: "amount_currency", title: "Currency" },
        { id: "price_quantity_tier", title: "Quantity" },
        { id: "price_price", title: "Price" },
      ],
    });
    await csvWriter.writeRecords(dumpPrices(entries));
  }
})().catch((e) => {
  console.log(e);
});
