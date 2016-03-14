var Client = require('cloudfoundry-client');
var fs = require('fs');
var async = require('async');
var request = require('request');
var vm = require('vm');

//not used yet
//var authenticatedClient = new Client({
//  host: 'api.ng.bluemix.net',
//  protocol: 'https:',
//  token: process.argv[2]
//});

var script = vm.createScript(fs.readFileSync('./public/js/bluemix-configuration.js'));
var sandbox = {};
script.runInNewContext(sandbox);
var categories = sandbox.categories;
console.log("Using categories", categories);
var regions = sandbox.regions;
console.log("Using regions", regions);

try {
  fs.mkdirSync('public/generated');
} catch (err) {
  console.log(err);
}
try {
  fs.mkdirSync('public/generated/icons');
} catch (err) {
  console.log(err);
}

var tasks = [];

// retrieve services from all regions
regions.forEach(function (region) {
  tasks.push(function (callback) {
    getRegion(region.api, region.serviceFilename, callback);
  });
});

function getRegion(api, outputFilename, callback) {
  var anonymousClient = new Client({
    host: api,
    protocol: 'https:',
    token: "" // no token, we get only what's public
  });
  console.log("Retrieving services for", api);
  anonymousClient.services.get(function (err, services) {
    if (err) {
      callback(err);
    } else {
      console.log("Found", services.length, "services");
      var stream = fs.createWriteStream(outputFilename);
      stream.once('open', function (fd) {
        stream.write(JSON.stringify(services, null, 2));
      });
      callback(null);
    }
  });
};

var services = [];

// load the reference file and mark its services as present in the DC
tasks.push(function (callback) {
  services = JSON.parse(fs.readFileSync(regions[0].serviceFilename));
  services.forEach(function (service) {
    service.entity.tags.push("custom_datacenter_" + regions[0].id);
  });
  callback(null);
});

// add tags for the other regions
regions.slice(1).forEach(function (otherRegion) {
  tasks.push(function (callback) {
    var otherServices = JSON.parse(fs.readFileSync(otherRegion.serviceFilename));

    var uidToServices = [];
    otherServices.forEach(function (service) {
      uidToServices[service.entity.unique_id] = service;
    });

    // mark the services
    services.forEach(function (service) {
      if (uidToServices.hasOwnProperty(service.entity.unique_id)) {
        service.entity.tags.push("custom_datacenter_" + otherRegion.id);
        delete uidToServices[service.entity.unique_id];
      }
    });

    if (uidToServices.length > 0) {
      console.log("Found", uidToServices.length, " only available in", otherRegion.id);
    }

    callback(null);
  });
});

// we got all services now
tasks.push(function (callback) {
  // use anonymous client so that we don't surface not public services
  console.log("Retrieving plans...");
  var anonymousClient = new Client({
    host: 'api.ng.bluemix.net',
    protocol: 'https:',
    token: "" // no token, we get only what's public
  });
  anonymousClient.servicePlans.get(function (err, servicePlans) {
    if (err) {
      callback(err);
    } else {
      servicePlans.forEach(function (plan) {
        if (plan.entity.extra) {
          plan.entity.extra = JSON.parse(plan.entity.extra);
        }
      });

      console.log("Found", servicePlans.length, "service plans");
      var stream = fs.createWriteStream("public/generated/plans.json");
      stream.once('open', function (fd) {
        stream.write(JSON.stringify(servicePlans, null, 2));
      });
      callback(null, servicePlans);
    }
  });
});

tasks.push(function (servicePlans, callback) {
  // use anonymous client so that we don't surface not public services
  var guidToServices = [];

  // resolve the embedded JSON value
  services.forEach(function (service) {

    // keep track of services to match their plans
    guidToServices[service.metadata.guid] = service;

    if (service.entity.extra) {
      service.entity.extra = JSON.parse(service.entity.extra);
    }

    // sort tags (categories first)
    service.entity.tags.sort(function (tag1, tag2) {
      var isCategory1 = categories.indexOf(tag1) >= 0
      var isCategory2 = categories.indexOf(tag2) >= 0
      if (isCategory1 && !isCategory2) {
        return -1;
      }

      if (!isCategory1 && isCategory2) {
        return 1;
      }

      return tag1.localeCompare(tag2);
    });

    // not all ibm services have the ibm_created tag, fix this!
    if (service.entity.provider != "core" &&
      service.entity.tags.indexOf("ibm_created") < 0 &&
      service.entity.tags.indexOf("ibm_third_party") < 0) {
      var isIbmService;
      service.entity.tags.forEach(function (tag) {
        if (tag.indexOf("ibm_") == 0) {
          isIbmService = true;
        }
      });
      if (isIbmService) {
        service.entity.tags.push("ibm_created");
      }
    }

    // TODO: prepare the plans array
    // service.plans = [];
  });

  // sort on name
  services.sort(function (s1, s2) {
    var s1Name = s1.entity.label;
    if (s1.entity.extra) {
      s1Name = s1.entity.extra.displayName || s1.entity.label;
    }
    var s2Name = s2.entity.label;
    if (s2.entity.extra) {
      s2Name = s2.entity.extra.displayName || s2.entity.label;
    }
    return s1Name.localeCompare(s2Name);
  });

  // add plans
  servicePlans.forEach(function (plan) {
    //TODO: add plans guidToServices[plan.entity.service_guid].plans.push(plan);
    // inject our custom "free" tag if the service has a free plan
    if (plan.entity.free == true) {
      guidToServices[plan.entity.service_guid].entity.tags.push("custom_has_free_plan");
    }
  });

  var stream = fs.createWriteStream("public/generated/services.json");
  stream.once('open', function (fd) {
    stream.write(JSON.stringify(services, null, 2));
  });

  getImages(services);

  callback(null);
});

async.waterfall(tasks, function (err, result) {
  if (err) {
    console.log(err);
  } else {
    console.log("Got", services.length, "from all regions");
    console.log("Retrieved all data");
  }
});

function getImages(services) {
  var tasks = []
  services.forEach(function (service) {
    tasks.push(function (callback) {
      //  /*
      //  "extra":
      //  "{\"locationDisplayName\":\"US South\",\"providerDisplayName\":\"Business Rules\",
      //  \"longDescription\":\"Enables developers to spend less time recoding and testing when the business policy changes. The Business Rules service minimizes your code changes by keeping business logic separate from application logic.\",
      //  \"displayName\":\"Business Rules\",
      //  \"imageUrl\":\"https://BusinessRulesServiceBroker.ng.bluemix.net/images/ODM-Cloud-OE-64.png\",
      //  \"smallImageUrl\":\"https://BusinessRulesServiceBroker.ng.bluemix.net/images/ODM-Cloud-OE-24.png\",
      //  \"mediumImageUrl\":\"https://BusinessRulesServiceBroker.ng.bluemix.net/images/ODM-Cloud-OE-32.png\",
      //  \"featuredImageUrl\":\"https://BusinessRulesServiceBroker.ng.bluemix.net/images/ODM-Cloud-OE-50.png\",
      //  \"instructionsUrl\":\"http://instructionsUrl\",\"documentationUrl\":
      //  \"https://www.ng.bluemix.net/docs/#services/rules/index.html#rules\",
      //  \"termsUrl\":\"https://www.ibm.com/software/sla/sladb.nsf/sla/bm-6678-01\",\"i18n\":{\"zh-Hant\":{\"description\":\"當商業原則變更時，可以讓開發人員花費較少的時間來記錄和測試。藉由將商業邏輯與應用程式邏輯分開，Business Rules 服務可讓您的程式碼變更減至最少。\",\"metadata\":{\"longDescription\":\"當商業原則變更時，可以讓開發人員花費較少的時間來記錄和測試。藉由將商業邏輯與應用程式邏輯分開，Business Rules 服務可讓您的程式碼變更減至最少。\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"API 呼叫是由規則執行引擎所呼叫，用以取得決策。\",\"free\":false,\"metadata\":{\"plan\":\"標準\",\"bullets\":[\"每月免費 1,000 次 API 呼叫\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1,000 次 API 呼叫\"}],\"displayName\":\"標準\"}}]},\"de\":{\"description\":\"Ermöglicht es Entwicklern, weniger Zeit für Änderungen am Programmcode und Testvorgänge aufzuwenden, wenn sich die Geschäftsrichtlinie ändert. Der Business Rules-Service minimiert Ihre Codeänderungen und hält Geschäftslogik und Anwendungslogik getrennt.\",\"metadata\":{\"longDescription\":\"Ermöglicht es Entwicklern, weniger Zeit für Änderungen am Programmcode und Testvorgänge aufzuwenden, wenn sich die Geschäftsrichtlinie ändert. Der Business Rules-Service minimiert Ihre Codeänderungen und hält Geschäftslogik und Anwendungslogik getrennt.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"Bei API-Aufrufen handelt es sich um Aufrufe, die von der Engine zur Regelausführung ausgehen, um eine Entscheidung zu erhalten.\",\"free\":false,\"metadata\":{\"plan\":\"Standard\",\"bullets\":[\"1.000 API-Aufrufe pro Monat frei\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1.000 API-Aufrufe\"}],\"displayName\":\"Standard\"}}]},\"zh-Hans\":{\"description\":\"使开发人员能够在业务策略发生更改时花费更少的时间来进行重新编码和测试。Business Rules 服务通过保持业务逻辑与应用逻辑的分离来最小化代码更改。\",\"metadata\":{\"longDescription\":\"使开发人员能够在业务策略发生更改时花费更少的时间来进行重新编码和测试。Business Rules 服务通过保持业务逻辑与应用逻辑的分离来最小化代码更改。\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"API 调用是规则执行引擎所进行的用于获取决策的调用。\",\"free\":false,\"metadata\":{\"plan\":\"标准\",\"bullets\":[\"每月 1000 次免费 API 调用\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1000 次 API 调用\"}],\"displayName\":\"标准\"}}]},\"it\":{\"description\":\"Consente agli sviluppatori di impiegare meno tempo nella ricodifica ed esecuzione dei test quando la politica di business viene modificata. Il servizio Business Rules riduce al minimo le modifiche del codice, mantenendo separata la logica di business dalla logica dell'applicazione.\",\"metadata\":{\"longDescription\":\"Consente agli sviluppatori di impiegare meno tempo nella ricodifica ed esecuzione dei test quando la politica di business viene modificata. Il servizio Business Rules riduce al minimo le modifiche del codice, mantenendo separata la logica di business dalla logica dell'applicazione.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"Le chiamate API sono chiamate effettuate dal motore di esecuzione delle regole per ottenere una decisione.\",\"free\":false,\"metadata\":{\"plan\":\"Standard\",\"bullets\":[\"1.000 chiamate API gratuite al mese\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1.000 chiamate API\"}],\"displayName\":\"Standard\"}}]},\"pt-BR\":{\"description\":\"Permite que os desenvolvedores gastem menos tempo registrando e testando quando a política de negócios é alterada. O serviço de Regras de negócios minimiza suas mudanças de código, mantendo a lógica de negócios separada da lógica de aplicativo.\",\"metadata\":{\"longDescription\":\"Permite que os desenvolvedores gastem menos tempo registrando e testando quando a política de negócios é alterada. O serviço de Regras de negócios minimiza suas mudanças de código, mantendo a lógica de negócios separada da lógica de aplicativo.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"As chamadas API são chamadas feitas pelo mecanismo de execução de regra para obter uma decisão.\",\"free\":false,\"metadata\":{\"plan\":\"Padrão\",\"bullets\":[\"1.000 chamadas API grátis por mês\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1.000 chamadas API\"}],\"displayName\":\"Padrão\"}}]},\"ko\":{\"description\":\"비즈니스 정책이 변경될 때 개발자가 레코딩 및 테스트에 사용하는 시간을 줄여줍니다. 비즈니스 규칙 서비스는 비즈니스 로직을 애플리케이션 로직과 분리함으로써 코드 변경사항을 최소화합니다.\",\"metadata\":{\"longDescription\":\"비즈니스 정책이 변경될 때 개발자가 레코딩 및 테스트에 사용하는 시간을 줄여줍니다. 비즈니스 규칙 서비스는 비즈니스 로직을 애플리케이션 로직과 분리함으로써 코드 변경사항을 최소화합니다.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"API 호출은 의사결정을 가져오기 위해 규칙 실행 엔진에서 작성하는 호출입니다.\",\"free\":false,\"metadata\":{\"plan\":\"표준\",\"bullets\":[\"월별 1,000개 API 호출 무료\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1,000개 API 호출\"}],\"displayName\":\"표준\"}}]},\"fr\":{\"description\":\"Permet aux développeurs de consacrer moins de temps au codage et au test lorsque la règle métier change. Le service Business Rules limite les modifications apportées au code en séparant la logique métier de la logique applicative.\",\"metadata\":{\"longDescription\":\"Permet aux développeurs de consacrer moins de temps au codage et au test lorsque la règle métier change. Le service Business Rules limite les modifications apportées au code en séparant la logique métier de la logique applicative.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"Les appels d'API sont des appels effectués par le moteur d'exécution de règle pour obtenir une décision.\",\"free\":false,\"metadata\":{\"plan\":\"Standard\",\"bullets\":[\"1000 appels d'API gratuits par mois\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1000 appels d'API\"}],\"displayName\":\"Standard\"}}]},\"en\":{\"description\":\"Enables developers to spend less time recoding and testing when the business policy changes. The Business Rules service minimizes your code changes by keeping business logic separate from application logic.\",\"metadata\":{\"longDescription\":\"Enables developers to spend less time recoding and testing when the business policy changes. The Business Rules service minimizes your code changes by keeping business logic separate from application logic.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"API calls are calls made by the rule execution engine to get a decision.\",\"free\":false,\"metadata\":{\"plan\":\"Standard\",\"bullets\":[\"1,000 API calls free per month\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1,000 API calls\"}],\"displayName\":\"Standard\"}}]},\"es\":{\"description\":\"Permite a los desarrolladores dedicar menos tiempo a grabar y hacer pruebas si cambia la política empresarial. El servicio Reglas empresariales minimiza los cambios de código manteniendo la lógica empresarial separada de la lógica de aplicaciones.\",\"metadata\":{\"longDescription\":\"Permite a los desarrolladores dedicar menos tiempo a grabar y hacer pruebas si cambia la política empresarial. El servicio Reglas empresariales minimiza los cambios de código manteniendo la lógica empresarial separada de la lógica de aplicaciones.\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"Las llamadas a la API las realiza el motor de ejecución de reglas para obtener una decisión.\",\"free\":false,\"metadata\":{\"plan\":\"Estándar\",\"bullets\":[\"1.000 llamadas a la API gratis al mes\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1.000 llamadas a la API\"}],\"displayName\":\"Estándar\"}}]},\"ja\":{\"description\":\"ビジネス・ポリシーが変更されたときに開発者が再コーディングとテストのために費やす時間を短縮できます。 Business Rules サービスは、ビジネス・ロジックとアプリケーション・ロジックを分離しておくことで、お客様が行うコード変更を最小限に抑えることができます。\",\"metadata\":{\"longDescription\":\"ビジネス・ポリシーが変更されたときに開発者が再コーディングとテストのために費やす時間を短縮できます。 Business Rules サービスは、ビジネス・ロジックとアプリケーション・ロジックを分離しておくことで、お客様が行うコード変更を最小限に抑えるこ���ができます。\"},\"plans\":[{\"id\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\",\"description\":\"API 呼び出しは、ルール実行エンジンが決定を下すために行う呼び出しです。\",\"free\":false,\"metadata\":{\"plan\":\"標準\",\"bullets\":[\"1 カ月に 1,000 回の API 呼び出し無料\"],\"costs\":[{\"unitId\":\"API_CALLS_PER_MONTH\",\"unit\":\"1,000 回の API 呼び出し\"}],\"displayName\":\"標準\"}}]}},\"plansOrder\":\"free_cf3438d3-48f0-4d80-87c0-98055fdbbdaeBusinessRules\"}",
      //  */
      //
      var extra = service.entity.extra;
      if (extra && extra.imageUrl) {
        request({
          url: extra.imageUrl,
          encoding: null
        }, function (err, res, body) {
          if (err) {
            callback(err);
          } else {
            fs.writeFile("public/generated/icons/" + service.metadata.guid + ".png", body, function (err) {
              if (err) {
                callback(err);
              } else {
                callback(null);
              }
            });
          }
        });
      }
    });
  });

  async.parallel(tasks, function (err, result) {
    console.log("Retrieved all icons");
    if (err) {
      console.log(err);
    }
  });
}
