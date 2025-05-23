const express = require('express');
const router = express.Router();
const supabase = require('../configs/client');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config({
    path: '.env.local'
});

// Example route
router.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API' });
});

// Example protected route
router.patch('/order', async (req, res) => {
    const { body } = req;
    console.log(body, 'backend called');
    try {
        const { orderId, txHash } = body;
        const { data, error: errorFetch } = await supabase
            .from('orders')
            .select()
            .eq('id', Number(orderId));

        const { error } = await supabase
            .from('orders')
            .update({
                status: 'PAID',
                txHash,
                updated_at: new Date()
            })
            .eq('id', Number(orderId));
        if (error) throw error;
        if (errorFetch) throw errorFetch;


        console.log(`calling callbackUrl: ${data?.[0]?.callbackUrl}`);
        console.log(`typeof data: ${typeof (data)}`);

        res.status(200).json({ message: 'Order updated' });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
            details: error.details
        });
    }

});
router.post('/order', async (req, res) => {
    const { api_key } = req.headers;
    if (!api_key) return res.status(401).json({ error: 'Unauthorized', message: 'API key is required' });

    const { data, error } = await supabase
        .from('merchants_api')
        .select()
        .eq('api_key', api_key);


    if (error) return res.status(500).json({ error: 'Internal Server Error', message: error.message, details: error.details });
    if (data.length === 0)  return res.status(401).json({ error: 'Unauthorized', message: 'Invalid API key' });
    
    const {
        seller,
        buyer,
        product,
        quantity,
        txHash,
        price,
        callbackUrl,
    } = req.body.data;
    try {
        const { error, data } = await supabase
            .from('orders')
            .insert({
                seller,
                buyer,
                product,
                quantity,
                txHash,
                price,
                callbackUrl,
                created_at: new Date()
            })
            .select();
        if (error) {
            throw error;
        }


        const qrData = {
            sellerAddress: seller,
            amount: data?.[0]?.price,
            productName: product,
            orderId: data?.[0]?.id,
            quantity: data?.[0]?.quantity,
        }
        // Convert the data to a string
        const dataString = JSON.stringify(qrData);

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(dataString);
        console.log(qrCodeDataUrl);
        // res.json({
        //     created: data,
        //     qrData: {
        //         sellerAddress: seller,
        //         amount: data?.[0]?.price,
        //         productName: product,
        //         orderId: data?.[0]?.id,
        //         quantity: data?.[0]?.quantity,
        //         contractAddress : process.env.CONTRACT_ADDRESS,
        //     }
        // });

        // Send HTML response
        return res.send(`
             <!DOCTYPE html >
            <html>
                <head>
                    <title>Order QR Code</title>
                    <style>
                        body {
                            display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        background-color: #f5f5f5;
                        font-family: Arial, sans-serif;
                }
                        .container {
                            text - align: center;
                        padding: 10px;
                        background-color: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        display:flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                }
                        .topbar {
                            display: flex;
                        justify-content: center;
                        width: 100%;
                }
                        .bottombar {
                            display: flex;
                        justify-content: space-between;
                        align-items: center;
                        width: 80%;
                }
                        img {
                            /*max-width: 500px;*/
                        
                }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="topbar">
                            <img
                                src='https://firebasestorage.googleapis.com/v0/b/byscript-io.appspot.com/o/omniumlogohorizontal-removebg-preview.png?alt=media&token=1b181d1f-2de4-45bd-8bcb-dbd9e2d68ad8'
                                alt="Omnium Logo"
                                width="200"
                            />

                        </div>
                        <img class="width:100rem;" src="${qrCodeDataUrl}" alt="QR Code">
                            <div class="bottombar">
                                <img
                                    src='https://home.idrx.co/_next/image?url=%2Fassets%2Fidrx-logo-horizontal.png&w=1200&q=75'
                                    alt="IDRX Logo"
                                    width="80"
                                />
                                <img
                                    src='http://bitcoinwiki.org/wp-content/uploads/2023/12/430px-Lisk-logo.png'
                                    alt="Lisk Logo"
                                    width="80"
                                />
                            </div>
                            <p>Scan this QR code with Omnium app to view order details</p>
                    </div>
                </body>
            </html>
        `)
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message, details: error.details });
    }
}); // Generate and save API Key

router.post('/generate-api-key', async (req, res) => {
  const { address, api_key_name } = req.body;

  if (!address) return res.status(400).json({ error: 'address is required' });
  if (!api_key_name) return res.status(400).json({ error: 'api_key_name is required' });


  // Generate secure API key (you can customize format)
  const api_key = `sk_${uuidv4().replace(/-/g, '')}`; // e.g., sk_abc123def456...
    console.log(api_key,'api_key');
  try {
    // Insert into Supabase
    const { data, error } = await supabase
      .from('merchants_api')
      .insert([
        {
          address,
          api_key,
          api_key_name
        },
      ]);

    if (error) throw error;

    res.json({ api_key });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to generate or save API key' });
  }
});


module.exports = router;