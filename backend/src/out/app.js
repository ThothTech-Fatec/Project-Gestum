"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
// Configura o CORS
app.use((0, cors_1.default)({
    origin: process.env.origin || 'http://localhost:3000', // Permite requisições do frontend
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
}));
// Middleware para parsear o corpo das requisições como JSON
app.use(express_1.default.json());
// Rota de cadastro
// Inicia o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
