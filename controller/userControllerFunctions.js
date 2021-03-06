//Dependencies
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const shortid = require("shortid");
const Razorpay = require("razorpay");

//Files
const { ItemDetail } = require("../models/itemSchema");
const { UserDetail } = require("../models/userSchema");
const { OrderDetail } = require("../models/orderSchema");
const razorInstance = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const {
	paymentCompletionMail,
	WelcomeMail,
	returnOrderMail,
	cancelOrderMail,
} = require("../api/sendMail");

//Controller Functions
/****************************User functions***********************************/
//GET USER DETAILS
exports.getUserDetails = async (req, res) => {
	//checking is user logged in or not
	const userId = req.session.userId;
	if (userId) {
		try {
			//user details fetched from the database
			let userDetails = await UserDetail.findById(userId).exec();
			res.send({ userDetails: userDetails, response: true });
		} catch (err) {
			res.send({ response: false, error: err });
		}
	} else {
		res.send({ response: false, error: "Not logged in" });
	}
};
//EDIT USER DETAILS
exports.editUserDetails = async (req, res) => {
	//body details are obtained
	const userId = req.session.userId;
	if (userId) {
		const phone = req.body.phone;
		const email = req.body.email;
		const firstName = req.body.firstName;
		const lastName = req.body.lastName;
		const orders = req.body.orders;
		const address = req.body.address;
		try {
			await UserDetail.findByIdAndUpdate(userId, {
				phone: phone,
				email: email,
				address: address,
				name: { firstName: firstName, lastName: lastName },
				orders: orders,
			});
			res.send({ response: true });
		} catch (error) {
			res.send({ response: false, error: error });
		}
	} else {
		res.send({ response: false, error: "Not logged in" });
	}
};

//DELETE USER
exports.deleteUser = async (req, res) => {
	//checking is user logged in or not
	const userId = req.session.userId;
	if (userId) {
		try {
			//user details fetched from the database
			await OrderDetail.deleteMany({ "user._id": userId });
			let userDetails = await UserDetail.findByIdAndDelete(userId).exec();
			req.session.destroy();
			res.send({ response: true });
		} catch (err) {
			res.send({ response: false, error: err });
		}
	} else {
		res.send({ response: false, error: "Not logged in" });
	}
};
exports.addRating = async (req, res) => {
	const userId = req.session.userId;
	const itemId = req.body.itemId;
	const userRating = req.body.userRating;
	if (userId) {
		let itemDetails = await ItemDetail.findById(itemId).exec();
		if (itemDetails.numberOfRatings == undefined) {
			itemDetails.numberOfRatings = 0;
		}
		if (itemDetails.rating) {
			itemDetails.rating =
				(itemDetails.rating * itemDetails.numberOfRatings + userRating) /
				(itemDetails.numberOfRatings + 1);
		} else {
			itemDetails.rating = userRating;
		}
		itemDetails.rating = itemDetails.rating.toFixed(1);
		itemDetails.numberOfRatings += 1;

		await ItemDetail.findByIdAndUpdate(
			itemId,
			{
				rating: itemDetails.rating,
				numberOfRatings: itemDetails.numberOfRatings,
			},
			(err) => {
				if (err) {
					res.send({ response: false, error: err });
				} else {
					res.send({ response: true });
				}
			}
		);
	} else {
		res.send({ response: false, error: "Not logged in" });
	}
};
/************************** CART CRUD OPERATION **********************************/
//ADD TO CART
exports.addToCart = async (req, res) => {
	const userId = req.session.userId;
	//checking is user logged in or not
	if (userId === undefined) {
		res.send({ response: false, error: "Not logged in" });
		return;
	}

	//body details are obtained
	const itemId = req.body.itemId;
	//item and user details fetched from the database
	try {
		const itemDetails = await ItemDetail.findById(itemId).exec();
		const userDetails = await UserDetail.findById(userId).exec();
		//User cart details fetched
		let userCart = userDetails.userCart;
		//flag checks whether the item is there in cart or not,if not then added to the userCart
		let flag = true;
		userCart = userCart.map((itemElement) => {
			if (itemElement.item._id == itemId) {
				itemElement.item = itemDetails;
				itemElement.Qty += 1;
				flag = false;
			}
			return itemElement;
		});
		if (flag) userCart = [...userCart, { item: itemDetails, Qty: 1 }];
		//Finally the userCart is updated to the database
		await UserDetail.findByIdAndUpdate(userId, { userCart: userCart });
		res.send({ response: true });
	} catch (error) {
		res.send({ response: false, error: error });
	}
};
//DELETE FROM CART
exports.deleteFromCart = async (req, res) => {
	const userId = req.session.userId;
	//checking is user logged in or not
	if (userId === undefined) {
		res.send({ response: false, error: "Not logged in" });
		return;
	}

	//body details are obtained
	const itemId = req.body.itemId;
	//user details fetched from the database
	try {
		const userDetails = await UserDetail.findById(userId).exec();
		//User cart details fetched
		let userCart = userDetails.userCart;
		//userCart is filtered and that item is removed
		userCart = userCart.filter((itemElement) => {
			if (itemElement.item._id != itemId) return itemElement;
		});
		//Finally the userCart is updated to the database
		await UserDetail.findByIdAndUpdate(userId, { userCart: userCart });
		res.send({ response: true });
	} catch (error) {
		res.send({ response: false, error: error });
	}
};

//UPDATE CART QTY
exports.updateQty = async (req, res) => {
	const userId = req.session.userId;
	//checking is user logged in or not
	if (userId === undefined) {
		res.send({ response: false, error: "Not logged in" });
		return;
	}

	//body details are obtained
	const itemId = req.body.itemId;
	const itemQty = req.body.itemQty;
	//user details fetched from the database
	try {
		const userDetails = await UserDetail.findById(userId).exec();
		let userCart = userDetails.userCart;
		//userCart is filtered and that item is removed
		userCart = userCart.map((itemElement) => {
			if (itemElement.item._id == itemId) {
				itemElement.Qty = itemQty;
			}
			return itemElement;
		});
		//Finally the userCart is updated to the database
		await UserDetail.findByIdAndUpdate(userId, { userCart: userCart });
		res.send({ response: true });
	} catch (error) {
		res.send({ response: false, error: error });
	}
};

//CLEAR CART
exports.clearCart = async (req, res) => {
	const userId = req.session.userId;
	//checking is user logged in or not
	if (userId === undefined) {
		res.send({ response: false, error: "Not logged in" });
		return;
	}
	try {
		await UserDetail.findByIdAndUpdate(userId, { userCart: [] });
		res.send({ response: true });
	} catch (error) {
		res.send({ response: false, error: error });
	}
};

exports.paymentOrder = async (req, res) => {
	//checking is user logged in or not
	const userId = req.session.userId;
	if (userId === undefined) {
		res.send({ response: false, error: "Not logged in" });
		return;
	}

	//razorpay
	const payment_capture = 1;
	const amount = req.body.totalAmt;
	const currency = "INR";

	const options = {
		amount: amount * 100,
		currency,
		receipt: shortid.generate(),
		payment_capture,
	};

	try {
		const response = await razorInstance.orders.create(options);
		res.json({
			id: response.id,
			currency: response.currency,
			amount: response.amount,
		});
	} catch (error) {
		res.send({ response: false, error: error });
	}
};

/*****************************LOGIN, SIGNUP, LOGOUT***************************/
//LOGIN
exports.login = async (req, res) => {
	function validatePhone(phone) {
		const re = /\d{10}/;
		return re.test(phone);
	}
	 if (!validatePhone(req.body.phone)) {
		res.send({
			response: false,
			error: "phone not in valid format ( 10 digits)",
		});
		return;
	}
	const { phone, password } = req.body;
	//finding the user in the database
	try {
		const user = await UserDetail.findOne({ phone: phone }).exec();
		if (user == null) {
			res.send({ response: false, error: "invalid user" });
			return;
		}
		//checking users password
		const isMatch = await bcrypt.compare(password, user.password);
		if (isMatch) {
			req.session.userId = user._id;
			res.send({ response: true });
		} else {
			res.send({ response: false, error: "password invalid" });
		}
	} catch (error) {
		res.send({ response: false, error: error });
		return;
	}
};
//SIGNUP
exports.signup = async (req, res) => {
	//validation of email and phone
	function validateEmail(email) {
		const re = /\S+@\S+\.\S+/;
		return re.test(email);
	}
	function validatePhone(phone) {
		const re = /\d{10}/;
		return re.test(phone);
	}
	if (!validateEmail(req.body.email)) {
		res.send({
			response: false,
			error: "Email not in valid format ( example@example.com)",
		});
		return;
	} else if (!validatePhone(req.body.phone)) {
		res.send({
			response: false,
			error: "phone not in valid format ( 10 digits)",
		});
		return;
	}
	try {
		//_id is added then updated to the database
		//hashing the password
		const hashedPassword = await bcrypt.hash(req.body.password, 12);
		const userData = {
			_id: new mongoose.Types.ObjectId(),
			name: { firstName: req.body.firstName, lastName: req.body.lastName },
			email: req.body.email,
			phone: req.body.phone,
			address: req.body.address,
			password: hashedPassword,
			admin: false,
		};

		//storing in database
		newUser = await new UserDetail(userData);
		await newUser.save();
		WelcomeMail(userData, res);
		// res.send({ response: true });
	} catch (error) {
		res.send({ response: false, error: error });
	}
};
//LOGOUT
exports.logout = async (req, res) => {
	req.session.destroy();
	res.redirect("/");
};
/********************************Item funtions********************************/
//Fetch ALL ITEMS
exports.fetchItems = async (req, res) => {
	//Fetching data from database
	try {
		const itemsData = await ItemDetail.find();
		res.send(itemsData);
	} catch (err) {
		res.send({ response: false, error: err });
	}
};
/***************************************ORDER*****************************/
//ADD ORDER
exports.addOrder = async (req, res) => {
	const userId = req.session.userId;
	if (userId === undefined) {
		res.send({ response: false, error: "Not logged in" });
		return;
	}
	const orderId = new mongoose.Types.ObjectId();

	try {
		await UserDetail.findByIdAndUpdate(
			userId,

			{
				orders: [
					...req.body.userOrders,
					{
						_id: orderId,
						order: req.body.userCart,
						deliveryStatus: false,
						dateOfOrder: new Date(),
						totalCost: req.body.totalCost,
						razorpayOrderId: req.body.razorpayOrderId,
						razorpayPaymentId: req.body.razorpayPaymentId,
						razorpaySignature: req.body.razorpaySignature,
					},
				],
			}
		);
		//Creating order detail of the customer
		const userDetails = await UserDetail.findById(userId);
		//order details
		const order = {
			_id: orderId,
			deliveryStatus: false,
			user: {
				_id: userDetails._id,
				name: { ...userDetails.name },
				phone: userDetails.phone,
				email: userDetails.email,
				address: userDetails.address,
			},
			order: req.body.userCart,
			dateOfOrder: new Date(),
			totalCost: req.body.totalCost,
			shippingAddress: req.body.shippingAddress,
			razorpayOrderId: req.body.razorpayOrderId,
			razorpayPaymentId: req.body.razorpayPaymentId,
			razorpaySignature: req.body.razorpaySignature,
		};
		//funtion that adds orders in the databse
		const addOrderToDatabase = async () => {
			try {
				const theOrder = await new OrderDetail(order);
				await theOrder.save();
			} catch (error) {
				res.send({ response: false, orderId: orderId, error: result.error });
				return;
			}
		};

		//function called
		addOrderToDatabase();

		//Sending mail of confirmation to customer
		const result = await paymentCompletionMail(order, res);

		// res.send({ response: true, orderId: orderId });
	} catch (error) {
		res.send({ response: false, error: error, orderId: orderId });
	}
};

//CANCEL ORDER
exports.cancelOrder = async (req, res) => {
	const userId = req.session.userId;

	if (userId === undefined) {
		res.send({ response: false, error: "Not logged in" });
		return;
	}

	try {
		const orderId = req.body.orderId;
		const userDetails = await UserDetail.findById(userId).exec();
		const orderDetails = await OrderDetail.findById(orderId);
		// before update
		let ordersList = userDetails.orders;
		//update cancelled status
		await OrderDetail.findByIdAndUpdate(orderId, {
			cancelledStatus: !orderDetails.cancelledStatus,
		});
		// after update
		ordersList = ordersList.filter(
			(orderElement) => orderElement._id != orderId
		);
		await UserDetail.findByIdAndUpdate(userId, {
			orders: ordersList,
		});
		if (orderDetails.deliveryStatus) returnOrderMail(orderDetails, res);
		else cancelOrderMail(orderDetails, res);
		// res.send({ response: true });
	} catch (error) {
		res.send({ response: false, error: error });
	}
};
