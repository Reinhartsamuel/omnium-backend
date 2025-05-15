const express = require('express');
const router = express.Router();
const supabase = require('../configs/client');

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
        const { data, error:errorFetch } = await supabase
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
        console.log(`typeof data: ${typeof(data)}`);

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
        res.json({ created: data });
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message, details: error.details });
    }
});

module.exports = router;