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
        ...orderbook
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
        return;
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




    // if (!INR_BALANCES[userId] || INR_BALANCES[userId].balance > (quantity * 2) * price) {
    //     res.status(404).json({
    //         error: 'Invalid Data',
    //     })
    // }



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


    INR_BALANCES[userId].balance -= (quantity * 2) * price;

    // console.log(INR_BALANCES[userId].balance);


    res.status(200).json({
        // stock_balance: STOCK_BALANCES[userId][stockSymbol],
        message: `Minted ${quantity} 'yes' and 'no' tokens for user ${userId}, remaining balance is ${INR_BALANCES[userId].balance}`
    })

})


router.post('/order/buy', (req, res) => {

    const { userId, stockSymbol, quantity, price, stockType } = req.body;

    if (!INR_BALANCES[userId] || INR_BALANCES[userId].balance < (quantity * price)) {

        res.status(400).json({
            message: "Insufficient INR balance"
        })
        return;
    }

    if (stockType == 'yes') {

        if (ORDERBOOK[stockSymbol]) {

            const pricesData = ORDERBOOK[stockSymbol]["yes"]


            for (let priceKey in pricesData) {

                    
                if (priceKey < price) {


                    if (ORDERBOOK[stockSymbol]["yes"][priceKey].total >= quantity) {

                        ORDERBOOK[stockSymbol]["yes"][priceKey].total -= quantity;
                        const temp = 0;

                        for (let user in ORDERBOOK[stockSymbol]["yes"][priceKey]["orders"]) {

                            if (ORDERBOOK[stockSymbol]["yes"][priceKey]["orders"][user] >= quantity) {

                                ORDERBOOK[stockSymbol]["yes"][priceKey]["orders"][user] -= quantity;

                                if (!STOCK_BALANCES[userId]) {
                                    STOCK_BALANCES[userId] = {
                                        [stockSymbol]: {
                                            yes: {
                                                "quantity": quantity,
                                                "locked": 0
                                            },
                                            no: {
                                            }
                                        }
                                    }
                                } else {
                                    if (!STOCK_BALANCES[userId][stockSymbol]) {
                                        STOCK_BALANCES[userId][stockSymbol] = {
                                            yes: {
                                                "quantity": quantity,
                                                "locked": 0
                                            },
                                            no: {
                                            }
                                        }
                                    } else {
                                        if (!STOCK_BALANCES[userId][stockSymbol]["yes"]) {
                                            STOCK_BALANCES[userId][stockSymbol]["yes"] = {
                                                "quantity": quantity,
                                                "locked": 0
                                            }
                                            STOCK_BALANCES[userId][stockSymbol]["no"] = {}
                                        }
                                        else {
                                            STOCK_BALANCES[userId][stockSymbol]["yes"]["quantity"] = (STOCK_BALANCES[userId][stockSymbol]["yes"]["quantity"] || 0) + quantity
                                        }
                                    }

                                }
                                STOCK_BALANCES[user][stockSymbol]["yes"]["locked"] -= quantity;

                                INR_BALANCES[userId].balance -= (quantity * priceKey)

                                if (ORDERBOOK[stockSymbol]["yes"][priceKey]["total"] == 0) {
                                    delete ORDERBOOK[stockSymbol]["yes"][priceKey]
                                }


                                console.log(ORDERBOOK);


                                res.status(200).json({
                                    message: `Buy order matched at best price ${priceKey}`
                                })
                                return;
                                // break;

                            } else {

                                temp = temp + ORDERBOOK[stockSymbol]["yes"][price]["orders"][user]
                                ORDERBOOK[stockSymbol]["yes"][price]["orders"][user] -= quantity;

                                STOCK_BALANCES[user][stockSymbol]["yes"]["locked"] -= quantity;
                                INR_BALANCES[user]['balance'] += quantity * price;

                            }

                            if (temp == quantity) {

                                res.status(200).json({
                                    message: `Buy order matched at best price ${priceKey}`
                                })
                                return;
                            }

                        }


                    }

                }

                if (priceKey == price) {

                    if (ORDERBOOK[stockSymbol]["yes"][priceKey].total >= quantity) {

                        ORDERBOOK[stockSymbol]["yes"][priceKey].total -= quantity;
                        const temp = 0;

                        for (let user in ORDERBOOK[stockSymbol]["yes"][priceKey]["orders"]) {

                            if (ORDERBOOK[stockSymbol]["yes"][priceKey]["orders"][user] >= quantity) {


                                ORDERBOOK[stockSymbol]["yes"][priceKey]["orders"][user] -= quantity;



                                if (!STOCK_BALANCES[userId]) {
                                    STOCK_BALANCES[userId][stockSymbol] = {
                                        yes: {
                                            "quantity": quantity,
                                            "locked": 0
                                        },
                                        no: {
                                        }
                                    }

                                } else {
                                    if (!STOCK_BALANCES[userId][stockSymbol]) {

                                        STOCK_BALANCES[userId][stockSymbol]["yes"]["quantity"] = quantity;
                                        STOCK_BALANCES[userId][stockSymbol]["no"] = {};
                                    } else {
                                        STOCK_BALANCES[userId][stockSymbol]["yes"]["quantity"] += quantity;
                                    }
                                }
                                STOCK_BALANCES[user][stockSymbol]["yes"]["locked"] -= quantity;

                                INR_BALANCES[userId].balance -= (quantity * priceKey)




                                res.status(200).json({
                                    message: `Buy order matched partially, ${STOCK_BALANCES[user][stockSymbol]['yes']['quantity']} remaining`
                                })
                                return;
                                // break;

                            } else {
                                temp = temp + ORDERBOOK[stockSymbol]["yes"][price]["orders"][user]
                                ORDERBOOK[stockSymbol]["yes"][price]["orders"][user] -= quantity;

                                STOCK_BALANCES[user][stockSymbol]["yes"]["locked"] -= quantity;
                                INR_BALANCES[user]['balance'] += quantity * price;

                            }

                            if (temp == quantity) {

                                res.status(200).json({
                                    message: `Buy order matched at best price ${priceKey}`
                                })
                                return;


                            }


                        }


                    }

                }

                if (priceKey > price) {

                    // Buy order placed and pending

                    if (!ORDERBOOK[stockSymbol]["yes"][price]) {
                        ORDERBOOK[stockSymbol]["no"][price] = {
                            ["total"]: quantity,
                            ["orders"]: {
                                [userId]: quantity,
                            }
                        }

                        STOCK_BALANCES[stockSymbol] = {
                            "no":{
                                "quantity": 0,
                                "locked": quantity
                            }
                        }

                        INR_BALANCES[userId].balance -= quantity * price
                        INR_BALANCES[userId].locked += quantity * price

                        res.status(200).json({
                            message:"Buy order placed and pending"
                        })

                    }
                    

                    // full fill 
                    // if (ORDERBOOK[stockSymbol]["yes"][price].total >= quantity) {

                    //     ORDERBOOK[stockSymbol]["yes"][priceKey].total -= quantity;
                    //     const temp = 0;

                    //     for (let user in ORDERBOOK[stockSymbol]["yes"][priceKey]["orders"]) {

                    //         if (ORDERBOOK[stockSymbol]["yes"][priceKey]["orders"][user] >= quantity) {

                    //             ORDERBOOK[stockSymbol]["yes"][priceKey]["orders"][user] -= quantity;

                    //             if (!STOCK_BALANCES[userId]) {
                    //                 STOCK_BALANCES[userId] = {
                    //                     [stockSymbol]: {
                    //                         yes: {
                    //                             "quantity": quantity,
                    //                             "locked": 0
                    //                         },
                    //                         no: {
                    //                         }
                    //                     }
                    //                 }
                    //             } else {
                    //                 if (!STOCK_BALANCES[userId][stockSymbol]) {
                    //                     STOCK_BALANCES[userId][stockSymbol] = {
                    //                         yes: {
                    //                             "quantity": quantity,
                    //                             "locked": 0
                    //                         },
                    //                         no: {
                    //                         }
                    //                     }
                    //                 } else {
                    //                     if (!STOCK_BALANCES[userId][stockSymbol]["yes"]) {
                    //                         STOCK_BALANCES[userId][stockSymbol]["yes"] = {
                    //                             "quantity": quantity,
                    //                             "locked": 0
                    //                         }
                    //                         STOCK_BALANCES[userId][stockSymbol]["no"] = {}
                    //                     }
                    //                     else {
                    //                         STOCK_BALANCES[userId][stockSymbol]["yes"]["quantity"] = (STOCK_BALANCES[userId][stockSymbol]["yes"]["quantity"] || 0) + quantity
                    //                     }
                    //                 }

                    //             }
                    //             STOCK_BALANCES[user][stockSymbol]["yes"]["locked"] -= quantity;

                    //             INR_BALANCES[userId].balance -= (quantity * priceKey)

                    //             if (ORDERBOOK[stockSymbol]["yes"][priceKey]["total"] == 0) {
                    //                 delete ORDERBOOK[stockSymbol]["yes"][priceKey]
                    //             }


                    //             res.status(200).json({
                    //                 message: `Buy order placed and pending`
                    //             })
                    //             return;
                    //             // break;

                    //         } else {

                    //             temp = temp + ORDERBOOK[stockSymbol]["yes"][price]["orders"][user]
                    //             ORDERBOOK[stockSymbol]["yes"][price]["orders"][user] -= quantity;

                    //             STOCK_BALANCES[user][stockSymbol]["yes"]["locked"] -= quantity;
                    //             INR_BALANCES[user]['balance'] += quantity * price;

                    //         }

                    //         if (temp == quantity) {

                    //             res.status(200).json({
                    //                 message: "Buy order placed and pending"
                    //             })
                    //             return;
                    //         }

                    //     }


                    // }

                    // if (ORDERBOOK[stockSymbol]["yes"][priceKey].total < quantity) {

                    //     const actualQuantity = quantity;
                    //     const pending = ORDERBOOK[stockSymbol]["yes"][priceKey].total - quantity
                    //     ORDERBOOK[stockSymbol]["yes"][priceKey].total -= quantity;
                    //     const temp = 0;

                    //     for (let user in ORDERBOOK[stockSymbol]["yes"][priceKey]["orders"]) {

                    //         if(ORDERBOOK[stockSymbol]["yes"][priceKey]["orders"][user]){

                    //             ORDERBOOK[stockSymbol]["yes"][priceKey]["orders"][user] -= quantity;
                    //             actualQuantity -= quantity;

                    //             if (!STOCK_BALANCES[userId]) {
                    //                 STOCK_BALANCES[userId] = {
                    //                     [stockSymbol]: {
                    //                         yes: {
                    //                             "quantity": quantity,
                    //                             "locked": 0
                    //                         },
                    //                         no: {
                    //                         }
                    //                     }
                    //                 }
                    //             } else {
                    //                 if (!STOCK_BALANCES[userId][stockSymbol]) {
                    //                     STOCK_BALANCES[userId][stockSymbol] = {
                    //                         yes: {
                    //                             "quantity": quantity,
                    //                             "locked": 0
                    //                         },
                    //                         no: {
                    //                         }
                    //                     }
                    //                 } else {
                    //                     if (!STOCK_BALANCES[userId][stockSymbol]["yes"]) {
                    //                         STOCK_BALANCES[userId][stockSymbol]["yes"] = {
                    //                             "quantity": quantity,
                    //                             "locked": 0
                    //                         }
                    //                         STOCK_BALANCES[userId][stockSymbol]["no"] = {}
                    //                     }
                    //                     else {
                    //                         STOCK_BALANCES[userId][stockSymbol]["yes"]["quantity"] = (STOCK_BALANCES[userId][stockSymbol]["yes"]["quantity"] || 0) + quantity
                    //                     }
                    //                 }

                    //             }
                    //             STOCK_BALANCES[user][stockSymbol]["yes"]["locked"] -= quantity;

                    //             INR_BALANCES[userId].balance -= (quantity * priceKey)

                    //             if (ORDERBOOK[stockSymbol]["yes"][priceKey]["total"] == 0) {
                    //                 delete ORDERBOOK[stockSymbol]["yes"][priceKey]
                    //             }
                    //         }

                    //     }


                    //     if (pending > 0) {

                    //         console.log(actualQuantity,pending);


                    //     }



                    // }

                    // if (!ORDERBOOK[stockSymbol]["yes"][priceKey] || ORDERBOOK[stockSymbol]["yes"][priceKey]?.total == 0) {

                    // }

                }
            }

        } else {

            ORDERBOOK[stockSymbol] = {
                "no": {

                }
            }
        }
    }

    if (stockType == 'no') {

        if (ORDERBOOK[stockSymbol]) {

            const pricesData = ORDERBOOK[stockSymbol]["no"]


            for (let priceKey in pricesData) {


                if (priceKey < price) {


                    if (ORDERBOOK[stockSymbol]["no"][priceKey].total >= quantity) {

                        ORDERBOOK[stockSymbol]["no"][priceKey].total -= quantity;
                        const temp = 0;

                        for (let user in ORDERBOOK[stockSymbol]["no"][priceKey]["orders"]) {

                            if (ORDERBOOK[stockSymbol]["no"][priceKey]["orders"][user] >= quantity) {

                                ORDERBOOK[stockSymbol]["no"][priceKey]["orders"][user] -= quantity;

                                if (!STOCK_BALANCES[userId]) {
                                    STOCK_BALANCES[userId] = {
                                        [stockSymbol]: {
                                            no: {
                                                "quantity": quantity,
                                                "locked": 0
                                            },
                                            yes: {
                                            }
                                        }
                                    }
                                } else {
                                    if (!STOCK_BALANCES[userId][stockSymbol]) {
                                        STOCK_BALANCES[userId][stockSymbol] = {
                                            no: {
                                                "quantity": quantity,
                                                "locked": 0
                                            },
                                            yes: {
                                            }
                                        }
                                    } else {
                                        if (!STOCK_BALANCES[userId][stockSymbol]["no"]) {
                                            STOCK_BALANCES[userId][stockSymbol]["no"] = {
                                                "quantity": quantity,
                                                "locked": 0
                                            }
                                            STOCK_BALANCES[userId][stockSymbol]["no"] = {}
                                        }
                                        else {
                                            STOCK_BALANCES[userId][stockSymbol]["no"]["quantity"] = (STOCK_BALANCES[userId][stockSymbol]["no"]["quantity"] || 0) + quantity
                                        }
                                    }

                                }
                                STOCK_BALANCES[user][stockSymbol]["no"]["locked"] -= quantity;

                                INR_BALANCES[userId].balance -= (quantity * priceKey)

                                if (ORDERBOOK[stockSymbol]["no"][priceKey]["total"] == 0) {
                                    delete ORDERBOOK[stockSymbol]["no"][priceKey]
                                }


                                res.status(200).json({
                                    message: `Buy order matched at best price ${priceKey}`
                                })
                                return;
                                // break;

                            } else {

                                temp = temp + ORDERBOOK[stockSymbol]["no"][price]["orders"][user]
                                ORDERBOOK[stockSymbol]["no"][price]["orders"][user] -= quantity;

                                STOCK_BALANCES[user][stockSymbol]["no"]["locked"] -= quantity;
                                INR_BALANCES[user]['balance'] += quantity * price;

                            }

                            if (temp == quantity) {

                                res.status(200).json({
                                    message: `Buy order matched at best price ${priceKey}`
                                })
                                return;
                            }

                        }


                    }

                }

                if (priceKey == price) {

                    if (ORDERBOOK[stockSymbol]["no"][priceKey].total >= quantity) {

                        ORDERBOOK[stockSymbol]["no"][priceKey].total -= quantity;
                        const temp = 0;

                        for (let user in ORDERBOOK[stockSymbol]["no"][priceKey]["orders"]) {

                            if (ORDERBOOK[stockSymbol]["no"][priceKey]["orders"][user] >= quantity) {


                                ORDERBOOK[stockSymbol]["no"][priceKey]["orders"][user] -= quantity;



                                if (!STOCK_BALANCES[userId]) {
                                    STOCK_BALANCES[userId][stockSymbol] = {
                                        no: {
                                            "quantity": quantity,
                                            "locked": 0
                                        },
                                        yes: {
                                        }
                                    }

                                } else {
                                    if (!STOCK_BALANCES[userId][stockSymbol]) {

                                        STOCK_BALANCES[userId][stockSymbol]["no"]["quantity"] = quantity;
                                        STOCK_BALANCES[userId][stockSymbol]["no"] = {};
                                    } else {
                                        STOCK_BALANCES[userId][stockSymbol]["no"]["quantity"] += quantity;
                                    }
                                }
                                STOCK_BALANCES[user][stockSymbol]["no"]["locked"] -= quantity;

                                INR_BALANCES[userId].balance -= (quantity * priceKey)




                                res.status(200).json({
                                    message: `Buy order matched partially, ${STOCK_BALANCES[user][stockSymbol]['no']['quantity']} remaining`
                                })
                                return;
                                // break;

                            } else {
                                temp = temp + ORDERBOOK[stockSymbol]["no"][price]["orders"][user]
                                ORDERBOOK[stockSymbol]["no"][price]["orders"][user] -= quantity;

                                STOCK_BALANCES[user][stockSymbol]["no"]["locked"] -= quantity;
                                INR_BALANCES[user]['balance'] += quantity * price;

                            }

                            if (temp == quantity) {

                                res.status(200).json({
                                    message: `Buy order matched at best price ${priceKey}`
                                })
                                return;


                            }


                        }


                    }

                }

                if (priceKey > price) {

                    // Buy order placed and pending

                    if (!ORDERBOOK[stockSymbol]["yes"][price]) {
                        ORDERBOOK[stockSymbol]["no"][price] = {
                            ["total"]: quantity,
                            ["orders"]: {
                                [userId]: quantity,
                            }
                        }

                        STOCK_BALANCES[stockSymbol] = {
                            "no":{
                                "quantity": 0,
                                "locked": quantity
                            }
                        }

                        INR_BALANCES[userId].balance -= quantity * price
                        INR_BALANCES[userId].locked += quantity * price

                        res.status(200).json({
                            message:"Buy order placed and pending"
                        })

                    }
                    

                   

                }
            }

        } else {

            ORDERBOOK[stockSymbol] = {
                "no": {

                }
            }
        }
    }


    INR_BALANCES[userId].balance -= (quantity * price)



    res.status(200).json({
        message: "Buy order placed and pending"
    })
})

router.post('/order/sell', (req, res) => {

    const { userId, stockSymbol, quantity, price, stockType } = req.body;

    if (!STOCK_BALANCES[userId] || !STOCK_BALANCES[userId][stockSymbol] || !STOCK_BALANCES[userId][stockSymbol][stockType] || STOCK_BALANCES[userId][stockSymbol][stockType].quantity < quantity) {
        return res.status(400).json({ message: "Insufficient stock balance" });
    }


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

            if (ORDERBOOK[stockSymbol]["yes"]) {

                if (ORDERBOOK[stockSymbol]["yes"][price]) {
                    ORDERBOOK[stockSymbol]["yes"][price]["total"] = (ORDERBOOK[stockSymbol]["yes"][price]["total"] || 0) + quantity;
                    ORDERBOOK[stockSymbol]["yes"][price]["orders"][userId] = (ORDERBOOK[stockSymbol]["yes"][price]["orders"][userId] || 0) + quantity;
                }
                // if (!ORDERBOOK[stockSymbol]["yes"]) {

                //     console.log("LINE 348",ORDERBOOK[stockSymbol]["yes"]);

                //     ORDERBOOK[stockSymbol] = {
                //         "yes": {
                //             [price]: {
                //                 "total": quantity,
                //                 "orders": {
                //                     [userId]: quantity

                //                 }
                //             }
                //         }
                //     }
                // }

                if (!ORDERBOOK[stockSymbol]["yes"][price]) {
                    ORDERBOOK[stockSymbol]["yes"][price] = {
                        "total": quantity,
                        "orders": {
                            [userId]: quantity
                        }
                    }
                }

            } else {

                ORDERBOOK[stockSymbol] = {
                    "yes": {
                        [price]: {
                            "total": quantity,
                            "orders": {
                                [userId]: quantity
                            }
                        }
                    }
                }
            }


        }
    }

    if (stockType == "no") {

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
                                [userId]: quantity
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
                                [userId]: quantity
                            }
                        }
                    }
                }
            }
        }

    }

    INR_BALANCES[userId].balance += (quantity * price)




    res.status(200).json({
        message: `Sell order placed and pending`
    })
})


router.post('/order/cancel', (req, res) => {
    const { userId, stockSymbol, quantity, price, stockType } = req.body;



    if (!ORDERBOOK[stockSymbol] || !ORDERBOOK[stockSymbol][stockType] || !ORDERBOOK[stockSymbol][stockType][price] || !ORDERBOOK[stockSymbol][stockType][price]['orders'][userId]) {
        res.status(404).json({
            message: 'No stock symbol found'
        })
    }

    if (ORDERBOOK[stockSymbol][stockType][price]['orders'][userId] < quantity) {
        res.status(404).json({
            message: 'No stock symbol found'
        })
    }

    ORDERBOOK[stockSymbol][stockType][price]['orders'][userId] -= quantity;
    ORDERBOOK[stockSymbol][stockType][price]['total'] -= quantity;

    STOCK_BALANCES[userId][stockSymbol][stockType]['quantity'] += quantity
    STOCK_BALANCES[userId][stockSymbol][stockType]['locked'] -= quantity

    if (ORDERBOOK[stockSymbol]["yes"][price]['orders'][userId] == 0) {
        ORDERBOOK[stockSymbol]["yes"] = {}
    }

    res.status(200).json({
        message: 'Sell order canceled'
    })

})

module.exports = router
