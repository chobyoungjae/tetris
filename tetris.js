class Tetris {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        this.currentPiece = null;
        this.nextPiece = null;
        this.gameOver = false;
        this.paused = false;
        
        this.pieces = this.definePieces();
        this.colors = [
            '#000000', '#FF4757', '#2ED573', '#3742FA', 
            '#FF6348', '#FFA502', '#A55EEA', '#26C6DA'
        ];
        
        this.init();
    }
    
    createBoard() {
        return Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    definePieces() {
        return [
            // I-piece
            [
                [
                    [0,0,0,0],
                    [1,1,1,1],
                    [0,0,0,0],
                    [0,0,0,0]
                ],
                [
                    [0,0,1,0],
                    [0,0,1,0],
                    [0,0,1,0],
                    [0,0,1,0]
                ]
            ],
            // O-piece
            [
                [
                    [2,2],
                    [2,2]
                ],
                [
                    [2,2],
                    [2,2]
                ],
                [
                    [2,2],
                    [2,2]
                ],
                [
                    [2,2],
                    [2,2]
                ]
            ],
            // T-piece
            [
                [
                    [0,3,0],
                    [3,3,3],
                    [0,0,0]
                ],
                [
                    [0,3,0],
                    [0,3,3],
                    [0,3,0]
                ],
                [
                    [0,0,0],
                    [3,3,3],
                    [0,3,0]
                ],
                [
                    [0,3,0],
                    [3,3,0],
                    [0,3,0]
                ]
            ],
            // S-piece
            [
                [
                    [0,4,4],
                    [4,4,0],
                    [0,0,0]
                ],
                [
                    [0,4,0],
                    [0,4,4],
                    [0,0,4]
                ]
            ],
            // Z-piece
            [
                [
                    [5,5,0],
                    [0,5,5],
                    [0,0,0]
                ],
                [
                    [0,0,5],
                    [0,5,5],
                    [0,5,0]
                ]
            ],
            // J-piece
            [
                [
                    [6,0,0],
                    [6,6,6],
                    [0,0,0]
                ],
                [
                    [0,6,6],
                    [0,6,0],
                    [0,6,0]
                ],
                [
                    [0,0,0],
                    [6,6,6],
                    [0,0,6]
                ],
                [
                    [0,6,0],
                    [0,6,0],
                    [6,6,0]
                ]
            ],
            // L-piece
            [
                [
                    [0,0,7],
                    [7,7,7],
                    [0,0,0]
                ],
                [
                    [0,7,0],
                    [0,7,0],
                    [0,7,7]
                ],
                [
                    [0,0,0],
                    [7,7,7],
                    [7,0,0]
                ],
                [
                    [7,7,0],
                    [0,7,0],
                    [0,7,0]
                ]
            ]
        ];
    }
    
    validatePieces() {
        this.pieces.forEach((piece, index) => {
            if (piece.length === 0) {
                console.warn(`Piece ${index} has no rotations`);
            }
            piece.forEach((rotation, rotIndex) => {
                if (!rotation || rotation.length === 0) {
                    console.warn(`Piece ${index} rotation ${rotIndex} is empty`);
                }
            });
        });
    }
    
    init() {
        this.validatePieces();
        this.spawnPiece();
        this.updateDisplay();
        this.bindEvents();
        this.gameLoop();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.paused) {
                if (e.code === 'KeyP') {
                    this.togglePause();
                    e.preventDefault();
                }
                return;
            }
            
            switch (e.code) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    e.preventDefault();
                    break;
                case 'Space':
                    this.hardDrop();
                    e.preventDefault();
                    break;
                case 'KeyP':
                    this.togglePause();
                    e.preventDefault();
                    break;
            }
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    spawnPiece() {
        if (!this.nextPiece) {
            this.nextPiece = this.getRandomPiece();
        }
        
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.getRandomPiece();
        
        this.currentPiece.x = Math.floor((this.BOARD_WIDTH - this.currentPiece.shape[0].length) / 2);
        this.currentPiece.y = 0;
        
        if (this.isCollision()) {
            this.gameOver = true;
            this.showGameOver();
        }
        
        this.drawNextPiece();
    }
    
    getRandomPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        const rotations = this.pieces[pieceIndex];
        const shape = rotations[0];
        
        return {
            shape: shape,
            rotations: rotations,
            rotation: 0,
            x: 0,
            y: 0
        };
    }
    
    movePiece(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        
        if (this.isCollision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            
            if (dy > 0) {
                this.placePiece();
                this.clearLines();
                this.spawnPiece();
            }
            
            return false;
        }
        return true;
    }
    
    rotatePiece() {
        const originalRotation = this.currentPiece.rotation;
        this.currentPiece.rotation = (this.currentPiece.rotation + 1) % this.currentPiece.rotations.length;
        this.currentPiece.shape = this.currentPiece.rotations[this.currentPiece.rotation];
        
        if (this.isCollision()) {
            this.currentPiece.rotation = originalRotation;
            this.currentPiece.shape = this.currentPiece.rotations[this.currentPiece.rotation];
        }
    }
    
    hardDrop() {
        while (this.movePiece(0, 1)) {
            this.score += 2;
        }
    }
    
    isCollision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x] !== 0) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH ||
                        boardY >= this.BOARD_HEIGHT ||
                        (boardY >= 0 && this.board[boardY][boardX] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x] !== 0) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.shape[y][x];
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 50);
            
            const linePoints = [0, 100, 300, 500, 800];
            this.score += linePoints[linesCleared] * this.level;
            
            this.updateDisplay();
        }
    }
    
    togglePause() {
        this.paused = !this.paused;
    }
    
    showGameOver() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
    }
    
    restart() {
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropTime = 0;
        this.dropInterval = 1000;
        this.currentPiece = null;
        this.nextPiece = null;
        this.gameOver = false;
        this.paused = false;
        
        document.getElementById('game-over').classList.add('hidden');
        this.spawnPiece();
        this.updateDisplay();
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x] !== 0) {
                    this.drawBlock(this.ctx, x, y, this.colors[this.board[y][x]]);
                }
            }
        }
        
        if (this.currentPiece && !this.gameOver) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x] !== 0) {
                        const boardX = this.currentPiece.x + x;
                        const boardY = this.currentPiece.y + y;
                        
                        if (boardY >= 0) {
                            this.drawBlock(this.ctx, boardX, boardY, this.colors[this.currentPiece.shape[y][x]]);
                        }
                    }
                }
            }
        }
        
        this.drawGrid();
        
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('일시정지', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const shape = this.nextPiece.shape;
            const blockSize = 20;
            const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;
            
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x] !== 0) {
                        this.nextCtx.fillStyle = this.colors[shape[y][x]];
                        this.nextCtx.fillRect(
                            offsetX + x * blockSize,
                            offsetY + y * blockSize,
                            blockSize - 1,
                            blockSize - 1
                        );
                    }
                }
            }
        }
    }
    
    drawBlock(ctx, x, y, color) {
        const blockX = x * this.BLOCK_SIZE;
        const blockY = y * this.BLOCK_SIZE;
        
        ctx.fillStyle = color;
        ctx.fillRect(blockX, blockY, this.BLOCK_SIZE - 1, this.BLOCK_SIZE - 1);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(blockX, blockY, this.BLOCK_SIZE - 1, 2);
        ctx.fillRect(blockX, blockY, 2, this.BLOCK_SIZE - 1);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(blockX, blockY + this.BLOCK_SIZE - 3, this.BLOCK_SIZE - 1, 2);
        ctx.fillRect(blockX + this.BLOCK_SIZE - 3, blockY, 2, this.BLOCK_SIZE - 1);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    gameLoop(timestamp = 0) {
        if (!this.gameOver) {
            if (!this.paused) {
                if (timestamp - this.dropTime > this.dropInterval) {
                    this.movePiece(0, 1);
                    this.dropTime = timestamp;
                }
            }
            
            this.draw();
            requestAnimationFrame(timestamp => this.gameLoop(timestamp));
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const game = new Tetris();
});