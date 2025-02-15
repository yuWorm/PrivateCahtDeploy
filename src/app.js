import express from 'express';
import morgan from 'morgan';
import { createServer } from 'http';
import { parse } from 'url';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config.js';
import { RoomManager } from './models/RoomManager.js';
import { WebSocketService } from './services/WebSocketService.js';
import { setupApiRoutes } from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class App {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.roomManager = new RoomManager();
        this.wsService = new WebSocketService(this.roomManager);
    }

    initialize() {
        // Middleware
        this.app.use(morgan('dev'));
        
        // Static files
        this.app.use(express.static(join(__dirname, '../dist')));
        
        // API routes
        this.app.use('/api', setupApiRoutes(this.roomManager));

        // WebSocket setup
        const wss = this.wsService.initialize(this.server);

        // WebSocket upgrade handling
        this.server.on('upgrade', (request, socket, head) => {
            const pathname = parse(request.url).pathname;
            const roomMatch = pathname.match(/^\/ws\/(\w+)$/);

            if (!roomMatch) {
                socket.destroy();
                return;
            }

            const roomId = roomMatch[1];

            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, roomId);
            });
        });

        // Start heartbeat checker
        this.wsService.startHeartbeatCheck();
    }

    start() {
        this.server.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });
    }
}