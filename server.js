const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// In-memory storage for orders
let orders = {};

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to receive orders from boutiques
app.post('/api/orders', (req, res) => {
    const order = req.body;
    const storeName = order.storeName;
    const date = order.date;

    if (!orders[date]) {
        orders[date] = {};
    }

    if (orders[date][storeName]) {
        return res.status(400).send({ message: 'Order already placed for this store on this date' });
    }

    orders[date][storeName] = order;
    res.status(201).send({ message: 'Order received' });
});

// Endpoint to get aggregated orders for the central kitchen
app.get('/api/orders', (req, res) => {
    const { date } = req.query;
    const aggregated = {};
    const storeOrders = orders[date] || {};

    for (let store in storeOrders) {
        storeOrders[store].products.forEach(item => {
            if (!aggregated[item.product]) {
                aggregated[item.product] = { total: 0 };
            }

            aggregated[item.product][store] = aggregated[item.product][store] || 0;
            aggregated[item.product][store] += parseFloat(item.quantity) || 0;
            aggregated[item.product].total += parseFloat(item.quantity) || 0;
        });
    }

    res.send({ aggregated, storeOrders });
});

// Endpoint to get all dates with orders
app.get('/api/dates', (req, res) => {
    res.send(Object.keys(orders));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
