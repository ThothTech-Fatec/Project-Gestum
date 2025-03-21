"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Login = void 0;
const express_1 = __importDefault(require("express"));
const dbconnection_js_1 = __importDefault(require("../config/dbconnection.js"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
const Login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.params;
    try {
        const [rows] = yield dbconnection_js_1.default.query("SELECT * FROM usuarios WHERE email_usuario = ? AND senha_usuario = ?", [email, password]);
        return res.status(200).json(rows);
    }
    catch (error) {
        console.error("Erro ao buscar todos os usuários:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
});
exports.Login = Login;
