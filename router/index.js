const express = require('express');
let { ORDERBOOK, INR_BALANCES, STOCK_BALANCES } = require('../db');


const router = express.Router();


router.post('/reset', (req, res) => {


    ORDERBOOK = {};
    INR_BALANCES = {}
    STOCK_BALANCES = {}
    res.status(200).json({
        message: "OK",
    })

})

// Description: Returns the in-memory ORDERBOOK  object
router.get('/orderbook', (req, res) => {

    const orderbook = ORDERBOOK;
    res.status(200).json({
        data: orderbook
    })

})

// Description: Returns the in-memory INR_BALANCES object
router.get('/balances/inr', (req, res) => {


    res.status(200).json({
        ...INR_BALANCES
    })

})

//Description: Returns the in-memory `STOCK_BALANCES`  object
router.get('/balances/stock', (req, res) => {

    const stock = STOCK_BALANCES;
    res.status(200).json({
        ...stock
    })

})

// Description: Returns the INR balance of a given user.
router.get('/balance/inr/:userId', (req, res) => {


    if (!req.params.userId.match(/[0-9]+/)) {
        res.status(400).send({
            error: "User id is invalid",
        })
        return
    }


    const { userId } = req.params;
    const data = INR_BALANCES[userId];

    if (!data) {
        res.status(404).json({
            error: "User not found"
        })
        return;
    }

    res.status(200).json({ data })

})


// Description: Returns the current buy and sell orders for a given stock.
router.get('/orderbook/:stockSymbol', (req, res) => {

    const { stockSymbol } = req.params
    const data = ORDERBOOK[stockSymbol]

    if (!data) {
        res.status(404).json({
            error: "Invalid stock symbol"
        })
        return;
    }

    res.status(200).json({ data })
})


// Description:Create a new user entry in INR_BALANCES with unique user Id and default 0 balances 
router.post('/user/create/:userId', (req, res) => {

    const { userId } = req.params;

    if (INR_BALANCES[userId]) {
        res.status(201).json({
            data: INR_BALANCES[userId],
            message: `User ${userId} created`

        })
    }

    INR_BALANCES[userId] = {
        balance: 0,
        locked: 0
    };

    res.status(201).json({
        data: INR_BALANCES[userId],
        message: `User ${userId} created`
    })
})

// Description: Create a new symbol in ORDERBOOK with default yes and no entries
router.post('/symbol/create/:stockSymbol', (req, res) => {

    const { stockSymbol } = req.params;

    if (!req.params.stockSymbol.match(/[0-9]+/)) {
        res.status(400).send({
            error: "stockSymbol id is invalid",
        })
        return
    }

    if (ORDERBOOK[stockSymbol]) {
        res.status(201).json({
            message: `Symbol ${stockSymbol} created`
        })
    }

    ORDERBOOK[stockSymbol] = {
        yes: {},
        no: {}
    };

    res.status(201).json({
        data: ORDERBOOK[stockSymbol],
        message: `Symbol ${stockSymbol} created`
    })
})


// Description: Lets the user onramp INR on the platform
router.post('/onramp/inr', (req, res) => {

    const { userId, amount } = req.body;


    if (!INR_BALANCES[userId]) {
        res.status(404).json({
            error: 'Invalid user ID',
        })
    }


    INR_BALANCES[userId].balance += amount;


    res.status(200).json({
        // data: INR_BALANCES[userId],
        message: `Onramped ${userId} with amount ${amount}`
    })

})

router.post('/trade/mint', (req, res) => {
    const { userId, stockSymbol, quantity, price } = req.body;


    if (!INR_BALANCES[userId] || INR_BALANCES[userId].balance > (quantity * 2) * price) {
        res.status(404).json({
            error: 'Invalid Data',
        })
    }

    STOCK_BALANCES[userId] = {
        [stockSymbol]: {
            yes: {
                "quantity": quantity,
                "locked": 0
            },
            no: {
                "quantity": quantity,
                "locked": 0
            }
        }
    }


    INR_BALANCES[userId].balance -= (quantity * 2) * price




    res.status(200).json({
        // stock_balance: STOCK_BALANCES[userId][stockSymbol],
        message: `Minted ${quantity} 'yes' and 'no' tokens for user ${userId}, remaining balance is ${INR_BALANCES[userId].balance}`
    })

})


router.post('/order/buy', (req, res) => {

    const { userId, stockSymbol, quantity, price, stockType } = req.body;

    // const userBal = INR_BALANCES[userId];

    if (stockType == 'yes') {
        // if (!userBal && !(userBal?.balance >= (quantity * price))) {
        //     res.status(411).json({
        //         error: "Insufficient balance"
        //     })
        // }

        const yesStock = ORDERBOOK[stockSymbol]["yes"][price]



        if (!yesStock) {
            // add new stock in no
            ORDERBOOK[stockSymbol]["no"] = {
                [price]: {
                    "total": quantity,
                    "orders": {
                        [userId]: quantity
                    }
                }
            };


            if (!STOCK_BALANCES[userId]) {
                STOCK_BALANCES = {
                    [userId]: {
                        [stockSymbol]: {
                            'yes': {
                                'quantity': quantity,
                                'locked': 0
                            }
                        }
                    }
                };
            }



        }
        //  else {

        //     if (ORDERBOOK[stockSymbol]["yes"][price]["total"] >= quantity) {

        //         ORDERBOOK[stockSymbol]["yes"][price]["total"] -= quantity;

        //         const temp = 0;
        //         ORDERBOOK[stockSymbol]["yes"][price]["orders"]

        //         for (let user in ORDERBOOK[stockSymbol]["yes"][price]["orders"]) {

        //             if (ORDERBOOK[stockSymbol]["yes"][price]["orders"][user] >= quantity) {
        //                 ORDERBOOK[stockSymbol]["yes"][price]["orders"][user] -= quantity;
        //                 break;
        //             } else {
        //                 temp = temp + ORDERBOOK[stockSymbol]["yes"][price]["orders"][user]
        //                 ORDERBOOK[stockSymbol]["yes"][price]["orders"][user] -= quantity;

        //             }

        //             if (temp == quantity) {
        //                 break;
        //             }
        //         }
        //         // ORDERBOOK[stockSymbol]["yes"][price]["orders"][userId] -= quantity

        //     } else {
        //         if (ORDERBOOK[stockSymbol]["yes"][price]["total"] > 0 && ORDERBOOK[stockSymbol]["yes"][price]["total"] < quantity) {
        //             const temp = quantity - ORDERBOOK[stockSymbol]["yes"][price]["total"];
        //             ORDERBOOK[stockSymbol]["yes"][price]["total"] = 0;
        //             ORDERBOOK[stockSymbol]["yes"][price]["orders"][userId] -= quantity
        //             // }else{
        //             ORDERBOOK[stockSymbol]["no"][price]["total"] += temp;
        //             ORDERBOOK[stockSymbol]["no"][price]["orders"][userId] += temp
        //         }
        //     }
        // }
    }

    // if (stockSymbol == "no") {
    //     if (!userBal && !(userBal.balance >= (quantity * price))) {
    //         res.status(411).json({
    //             error: "Insufficient balance"
    //         })
    //     }

    //     if (!INR_BALANCES[userId] || !ORDERBOOK[stockSymbol] || price != 10 || price != 0) {
    //         res.status(404).json({
    //             error: 'Invalid Data',
    //         })
    //     }

    //     const noStock = ORDERBOOK[stockSymbol]["no"][price]

    //     if (!noStock) {
    //         // add new stock in no
    //         ORDERBOOK[stockSymbol]["yes"][price]["total"] = (ORDERBOOK[stockSymbol]["yes"]["total"] || 0) + quantity;
    //         ORDERBOOK[stockSymbol]["yes"][price]["orders"][userId] = quantity

    //     } else {

    //         if (ORDERBOOK[stockSymbol]["no"][price]["total"] >= quantity) {

    //             ORDERBOOK[stockSymbol]["no"][price]["total"] -= quantity;
    //             ORDERBOOK[stockSymbol]["no"][price]["orders"][userId] -= quantity

    //         } else {
    //             if (ORDERBOOK[stockSymbol]["no"][price]["total"] > 0 && ORDERBOOK[stockSymbol]["no"][price]["total"] < quantity) {
    //                 const temp = quantity - ORDERBOOK[stockSymbol]["no"][price]["total"];
    //                 ORDERBOOK[stockSymbol]["no"][price]["total"] = 0;
    //                 ORDERBOOK[stockSymbol]["no"][price]["orders"][userId] -= quantity
    //                 // }else{
    //                 ORDERBOOK[stockSymbol]["yes"][price]["total"] += temp;
    //                 ORDERBOOK[stockSymbol]["yes"][price]["orders"][userId] += temp
    //             }
    //         }
    //     }
    // }


    INR_BALANCES[userId].balance -= (quantity * price)



    res.status(200).json({
        message: "Buy order placed and trade executed"
    })
})

router.post('/order/sell', (req, res) => {

    const { userId, stockSymbol, quantity, price, stockType } = req.body;


    if (stockType == 'yes') {


        const yesStock = STOCK_BALANCES[userId][stockSymbol]["yes"]["quantity"]



        if (!yesStock || yesStock < quantity) {

            res.status(404).json({
                error: "Insufficient stock"
            })

        }

        if (STOCK_BALANCES[userId][stockSymbol]["yes"]["quantity"] >= quantity) {

            STOCK_BALANCES[userId][stockSymbol]["yes"]["quantity"] -= quantity;
            STOCK_BALANCES[userId][stockSymbol]["yes"]["locked"] += quantity;

            if (ORDERBOOK[stockSymbol]) {
                if (ORDERBOOK[stockSymbol]["yes"] && ORDERBOOK[stockSymbol]["yes"][price]) {
                    ORDERBOOK[stockSymbol]["yes"][price]["total"] = (ORDERBOOK[stockSymbol]["yes"][price]["total"] || 0) + quantity;
                    ORDERBOOK[stockSymbol]["yes"][price]["orders"][userId] = (ORDERBOOK[stockSymbol]["yes"][price]["orders"][userId] || 0) + quantity;
                }

                if (!ORDERBOOK[stockSymbol]["yes"]) {
                    ORDERBOOK[stockSymbol] = {
                        "yes": {
                            [price]: {
                                "total": quantity,
                                "orders": {
                                    [userId]: {
                                        quantity
                                    }
                                }
                            }
                        }
                    }
                }

                if (!ORDERBOOK[stockSymbol]["yes"][price]) {
                    ORDERBOOK[stockSymbol]["yes"] = {
                        [price]: {
                            "total": quantity,
                            "orders": {
                                [userId]: {
                                    quantity
                                }
                            }
                        }
                    }
                }

            } else {
                ORDERBOOK[stockSymbol] = {
                    "yes": {
                        [price]: {
                            "total": quantity,
                            "orders": {
                                [userId]: {
                                    quantity
                                }
                            }
                        }
                    }
                }
            }


        }
    }

    if (stockSymbol == "no") {

        const noStock = STOCK_BALANCES[userId][stockSymbol]["yes"]["quantity"]



        if (!noStock || noStock < quantity) {

            res.status(404).json({
                error: "Insufficient stock"
            })

        }

        if (STOCK_BALANCES[userId][stockSymbol]["no"]["quantity"] >= quantity) {

            STOCK_BALANCES[userId][stockSymbol]["no"]["quantity"] -= quantity;
            STOCK_BALANCES[userId][stockSymbol]["no"]["locked"] += quantity;

            if (ORDERBOOK[stockSymbol]) {
                if (ORDERBOOK[stockSymbol]["no"] && ORDERBOOK[stockSymbol]["no"][price]) {
                    ORDERBOOK[stockSymbol]["no"][price]["total"] = (ORDERBOOK[stockSymbol]["no"][price]["total"] || 0) + quantity;
                    ORDERBOOK[stockSymbol]["no"][price]["orders"][userId] = (ORDERBOOK[stockSymbol]["no"][price]["orders"][userId] || 0) + quantity;
                }

                if (!ORDERBOOK[stockSymbol]["no"]) {
                    ORDERBOOK[stockSymbol] = {
                        "no": {
                            [price]: {
                                "total": quantity,
                                "orders": {
                                    [userId]: {
                                        quantity
                                    }
                                }
                            }
                        }
                    }
                }

                if (!ORDERBOOK[stockSymbol]["no"][price]) {
                    ORDERBOOK[stockSymbol]["no"] = {
                        [price]: {
                            "total": quantity,
                            "orders": {
                                [userId]: {
                                    quantity
                                }
                            }
                        }
                    }
                }

            } else {
                ORDERBOOK[stockSymbol] = {
                    "no": {
                        [price]: {
                            "total": quantity,
                            "orders": {
                                [userId]: {
                                    quantity
                                }
                            }
                        }
                    }
                }
            }
        }

    }

    INR_BALANCES[userId].balance += (quantity * price)

    res.status(200).json({
        message: `Sell order placed for ${quantity} '${stockType}' options at price ${price}.`
    })
})


module.exports = router
