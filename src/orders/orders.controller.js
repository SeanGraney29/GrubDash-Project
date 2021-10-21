const path = require("path");

const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");


//////////VERBS///////
function list(req, res) {res.json({ data: orders })};
function read(req, res) {res.json({ data: res.locals.order })};

function create(req, res) {
	const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
	const newOrder = { id: nextId(), deliverTo, mobileNumber, dishes, status: status ? status : "pending" }
	orders.push(newOrder);
	res.status(201).json({ data: newOrder });
}

function update(req, res) {
	const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;
	res.locals.order = { id: res.locals.order.id, deliverTo, mobileNumber, dishes, status };
	res.json({ data: res.locals.order });
}

function destroy(req, res, next) {
  const index = orders.indexOf(res.locals.order);
  (res.locals.order.status === "pending") ?
	(orders.splice(index, 1), res.sendStatus(204)) :
  next({
			status: 400,
			message: "An order cannot be deleted unless it is pending",
		})
}


//////MIDDLEWARE////////
function orderIsRight(req, res, next) {
	const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
	let detail =
    (dishes === undefined || !dishes[0] || !Array.isArray(dishes)) ? "at least one dish" :
	(!deliverTo) ? "a deliverTo" :
    (!mobileNumber) ? "a mobileNumber" : '';
	if(detail) {
		next({
			status: 400,
			message: `Order must have ${detail}`,
        })}
      for(let i = 0; i < dishes.length; i++) {
        let dq = dishes[i].quantity
			if(dq <= 0 || !Number.isInteger(dq))
              next({
			status: 400,
			message: `Dish ${i} must have a quantity that is an integer greater than 0`,
		})}
	next();
}

function orderIdExists(req, res, next) {
	const { orderId } = req.params;
	const foundOrder = orders.find((order) => order.id === orderId);
	if(foundOrder) {
		res.locals.order = foundOrder;
      next();
	}
	next({
		status: 404,
		message: `Order id does not exist: ${orderId}`,
	});
}

function checkStatus(req, res, next) {
	const { orderId } = req.params;
	const { data: { id, status } = {} } = req.body;
	let message =
	(id && id !== orderId) ? `Order id does not match route id. Order: ${id}, Route: ${orderId}` :
    (status === "" || (status !== "pending" && status !== "preparing" && status !== "out-for-delivery")) ?
	"Order must have a status of pending, preparing, out-for-delivery, delivered" :
    (status === "delivered") ? "A delivered order cannot be changed" : '';
	if(message) {
      next({
			status: 400,
			message,
		});
	}
	next();
}

////EXPORTS////////

module.exports = {
	list,
	create: [orderIsRight, create],
	read: [orderIdExists, read],
	update: [orderIsRight, orderIdExists, checkStatus, update],
	delete: [orderIdExists, destroy],
}