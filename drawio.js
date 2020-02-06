
// https://github.com/jgraph/drawio/blob/607e2536f03d57bef8c5b6e90e6aba1728661c1c/src/main/webapp/js/mxgraph/Graph.js#L1035
const pako = require('pako');

const Base64 = {

	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;

		while (i < input.length) {

			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

		}

		return output;
	}
}

function DrawIOLibrary() {
  const self = this;
  const fs = require('fs');
  const Entities = require('html-entities').AllHtmlEntities;
  const entities = new Entities();

  self.generate = function(outputFilename) {
    const resources = JSON.parse(fs.readFileSync('public/generated/resources-full.json', 'utf8'))
      // .filter(resource =>
      //   resource.tags.indexOf('ibm_deprecated') < 0 &&
      //   resource.tags.indexOf('ibm_experimental') < 0)
      //  &&
      // resource.tags.indexOf('ibm_created')>=0)
      .sort((resource1, resource2) => resource1.displayName.localeCompare(resource2.displayName));


    const resourceIcons = [];
    resources.forEach(resource => {
      if (!resource.localPngIcon && !resource.localSvgIcon) {
        console.log('No icon for', resource.displayName);
      } else {
        const escapedTitle = entities.encode(resource.displayName);

        const imageContent = fs.readFileSync(resource.localSvgIcon ? resource.localSvgIcon : resource.localPngIcon);
        const imageContentBase64 = imageContent.toString('base64');
				const imageData = resource.localSvgIcon ?
					`data:image/svg+xml,${imageContentBase64}` :
					`data:image/png,${imageContentBase64}`;

        const graphModel = `
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="${escapedTitle}"
      style="shape=image;verticalLabelPosition=bottom;verticalAlign=top;imageAspect=0;aspect=fixed;image=${imageData}" vertex="1" parent="1"><mxGeometry width="64" height="64" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

        const xmlContent = compress(graphModel, false);
        resourceIcons.push({
          xml: xmlContent,
          w: 64,
          h: 64,
          aspect: 'fixed',
          title: entities.encode(resource.displayName),
        });
      }
    });
    fs.writeFileSync(outputFilename, `<mxlibrary title="IBM Cloud Catalog">${JSON.stringify(resourceIcons, null, null)}</mxlibrary>`);
  };

  function compress(data, deflate) {
    const tmp = (deflate) ?
  		pako.deflate(encodeURIComponent(data), {to: 'string'}) :
	  	pako.deflateRaw(encodeURIComponent(data), {to: 'string'});
    return Base64.encode(tmp);
  };
}

module.exports = function () {
  return new DrawIOLibrary();
}
