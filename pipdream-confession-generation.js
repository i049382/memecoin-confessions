    import sharp from "sharp";

    import axios from "axios";

    import fs from "fs";

    import path from "path";

    export default {

    name: "Generate Confession Image", // The name of the component

    version: "0.0.6", // Versioning

    key: "generate_confession_image",

    description: "Generates an image with a confession overlayed on a template and saves it to /tmp.",

    type: "action", // Define as an action

    props: {

    confessionText: {

    type: "string",

    label: "Confession Text",

    description: "The anonymous confession text to overlay on the image.",

    },

    imageTemplate: {

    type: "string",

    label: "Image Template URL",

    description: "URL of the template image you want to use as a background.",

    },

    },

    async run({ steps, $ }) {

    // Fetch the image template from a URL

    const response = await axios.get(this.imageTemplate, {

    responseType: "arraybuffer",

    });

    const imageBuffer = Buffer.from(response.data, "binary");

    // Fetch image dimensions

    const imageMetadata = await sharp(imageBuffer).metadata();

    console.log("Image dimensions:", imageMetadata.width, "x", imageMetadata.height);

    // Calculate dimensions for the text box
    const sidePadding = 150;
    const textBoxWidth = imageMetadata.width - (sidePadding * 2);
    const textBoxHeight = imageMetadata.height - 300;

    // Function to wrap text
    function wrapText(text, maxWidth, fontSize) {
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = (currentLine.length + word.length + 1) * (fontSize * 0.6); // Approximate width
        
        if (width < maxWidth) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    }

    const fontSize = 40;
    const lineHeight = 1.3; // Slightly increased for better readability
    const maxWidth = imageMetadata.width - 300;
    const verticalOffset = 50;
    const lines = wrapText(this.confessionText, maxWidth, fontSize);

    const outputBuffer = await sharp(imageBuffer)
      .composite([
        {
          input: Buffer.from(`
            <svg width="${imageMetadata.width}" height="${imageMetadata.height}">
              ${lines.map((line, i) => `
                <text
                  x="50%"
                  y="${(imageMetadata.height / 2) - ((lines.length - 1) * fontSize * lineHeight / 2) + (i * fontSize * lineHeight) + verticalOffset}"
                  font-family="'Inter', 'SF Pro Display', system-ui"
                  font-size="${fontSize}"
                  font-weight="700"
                  text-anchor="middle"
                  fill="black"
                  style="letter-spacing: 0.5px"
                >${line}</text>
              `).join('')}
            </svg>
          `),
          gravity: 'center'
        }
      ])
      .toBuffer();

    // Define the file path to save the image in the /tmp directory

    const filePath = path.join("/tmp", "confession-image.png");

    // Write the image buffer to the file

    fs.writeFileSync(filePath, outputBuffer);

    // Export the file path

    $.export("filePath", filePath);

    return {

    message: "Confession image created and saved to /tmp successfully!",

    filePath,

    };

    }

    };
