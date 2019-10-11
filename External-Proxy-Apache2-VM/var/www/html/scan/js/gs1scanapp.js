let gtinValue = "";


function processImage(e)
{
    let input = document.getElementById("imageFile");
    if (input.files && input
            .files.length)
    {
        detectGTIN(URL.createObjectURL(input.files[0]));
    }
}

function detectGTIN(src)
{

    let config = {
        "inputStream": {"size": 800, "singleChannel": false},
        "locator": {"patchSize": "medium", "halfSample": true},
        "decoder": {"readers": [{"format": "ean_reader", "config": {}}, {"format": "ean_8_reader", "config": {}}]},
        "locate": true,
        "src": src
    };

    Quagga.decodeSingle(config, function (result)
    {
        let divResult = document.getElementById("divResult");
        if(result === undefined)
        {
            alert('Sorry, no GTIN barcode was spotted in your image. Please make sure the barcode you are imaging is as brightly lit as possible!');
            divResult.innerText = 'Sorry, no GTIN barcode was spotted in your image. Please make sure the barcode you are imaging is as brightly lit as possible!';
        }
        else
        {
            divResult.innerText = result.codeResult.code;
        }

        gtinValue = result.codeResult.code;

        if (isNumeric(gtinValue) && (gtinValue.length === 8 || gtinValue.length === 12 || gtinValue.length === 13 || gtinValue.length === 14))
        {
            callDataGS1GTINAPI(gtinValue);
        }
        else
        {
            alert("The digits '" + gtinValue + "' are not those of a barcode GTIN");
        }
    });
}

function callDataGS1GTINAPI(gtin)
{
    let url = "https://data.gs1.org/gtin/";
    if(gtin.length === 8)
    {
        url += gtin;
    }
    else
    {
        let gtin14 = gtin;
        for (let i = gtin14.length;
             i < 14;
             i++)
        {
            gtin14 = "0" + gtin14;
        }
        url += gtin14;
    }
    window.open(url, "_self");
}

function isNumeric(num)
{
    return !isNaN(num)
}
