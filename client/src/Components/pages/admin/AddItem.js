import React, { useState } from "react";

const AddItem = () => {
  const [itemDetails, setItemDetails] = useState({
    category: "",
    cost: "",
    description: "",
    imageURL: "",
    itemName: "",
  });
  return (
    <div className="adminPanel">
      <h1>Add Item</h1>
      <form className="container p-3 m-0 ml-4" action="/addItem" method="POST">
        <h3>Enter Item Details</h3>
        <div className="row m-3">
          <div className="col-12">
            <label>Item Name: </label>
            <input
              type="text"
              name="itemName"
              placeholder="Item Name"
              required
              value={itemDetails.itemName}
              onChange={(e) => {
                setItemDetails({ ...itemDetails, itemName: e.target.value });
              }}
            ></input>
          </div>
          <div className="col-12">
            <label>Description: </label>
            <textarea
              name="description"
              placeholder="Description"
              required
              value={itemDetails.description}
              onChange={(e) => {
                setItemDetails({ ...itemDetails, description: e.target.value });
              }}
            ></textarea>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <label>Category: </label>
            <input
              type="text"
              name="category"
              placeholder="Category"
              required
              value={itemDetails.category}
              onChange={(e) => {
                setItemDetails({ ...itemDetails, category: e.target.value });
              }}
            ></input>
          </div>
          <div className="col-12">
            <label>Cost: </label>
            <input
              type="text"
              name="cost"
              placeholder="Cost"
              required
              value={itemDetails.cost}
              onChange={(e) => {
                setItemDetails({ ...itemDetails, cost: e.target.value });
              }}
            ></input>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <label>Image URL: </label>
            <input
              type="text"
              name="imageURL"
              placeholder="Image URL"
              required
              value={itemDetails.imageURL}
              onChange={(e) => {
                setItemDetails({ ...itemDetails, imageURL: e.target.value });
              }}
            ></input>
          </div>
        </div>
        <button className="btn btn-primary">Add Item</button>
      </form>
    </div>
  );
};

export default AddItem;