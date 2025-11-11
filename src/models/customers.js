import { DataTypes } from "sequelize";
import { connectDBPOSSequelize } from "../config/dbConnection.js";

const Customer = connectDBPOSSequelize.define(
  "customer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nisn: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    class: {
      type: DataTypes.STRING(3),
      allowNull: false,
      validate: {
        isIn: [['X', 'XI', 'XII']],
      },
    },
    major: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['RPL', 'DKV1', 'DKV2', 'BR', 'MP', 'AK']],
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "customer",
    timestamps: false,
  }
);

export default Customer;
