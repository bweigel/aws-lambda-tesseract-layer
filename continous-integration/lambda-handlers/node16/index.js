import recognize from 'tesseractocr'

exports.handler = async function(event) {
    const text = await recognize('faust.png')
    return {
      statusCode: 200,
      body: text
    };
  };
