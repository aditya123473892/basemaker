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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var userService_1 = require("../src/services/userService");
var UserRepository_1 = require("../src/repositories/user/UserRepository");
function seedUsers() {
    return __awaiter(this, void 0, void 0, function () {
        var userRepository, userService, sampleUsers, _i, sampleUsers_1, userData, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    userRepository = new UserRepository_1.UserRepository();
                    userService = new userService_1.UserService(userRepository);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    console.log('🌱 Seeding users...');
                    sampleUsers = [
                        {
                            companyId: '550e8400-e29b-41d4-a716-446655440000', // Use the same company ID as auth system
                            email: 'admin@example.com',
                            fullName: 'John Admin',
                            password: 'admin123',
                            role: 'ADMIN'
                        },
                        {
                            companyId: '550e8400-e29b-41d4-a716-446655440000',
                            email: 'manager@example.com',
                            fullName: 'Sarah Manager',
                            password: 'manager123',
                            role: 'MANAGER'
                        },
                        {
                            companyId: '550e8400-e29b-41d4-a716-446655440000',
                            email: 'user1@example.com',
                            fullName: 'Mike Johnson',
                            password: 'user123',
                            role: 'USER'
                        },
                        {
                            companyId: '550e8400-e29b-41d4-a716-446655440000',
                            email: 'user2@example.com',
                            fullName: 'Emily Davis',
                            password: 'user123',
                            role: 'USER'
                        },
                        {
                            companyId: '550e8400-e29b-41d4-a716-446655440000',
                            email: 'owner@example.com',
                            fullName: 'Robert Owner',
                            password: 'owner123',
                            role: 'OWNER'
                        }
                    ];
                    _i = 0, sampleUsers_1 = sampleUsers;
                    _a.label = 2;
                case 2:
                    if (!(_i < sampleUsers_1.length)) return [3 /*break*/, 7];
                    userData = sampleUsers_1[_i];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, userService.createUser(userData)];
                case 4:
                    _a.sent();
                    console.log("\u2705 Created user: ".concat(userData.email));
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.log("\u26A0\uFE0F  User ".concat(userData.email, " may already exist:"), error_1.message);
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7:
                    console.log('🎉 User seeding completed!');
                    return [3 /*break*/, 9];
                case 8:
                    error_2 = _a.sent();
                    console.error('❌ Error seeding users:', error_2);
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// Run the seed function
seedUsers().then(function () {
    console.log('Seed script finished');
    process.exit(0);
}).catch(function (error) {
    console.error('Seed script failed:', error);
    process.exit(1);
});
