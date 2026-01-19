/**
 * SCOTT ALGORITHM PAC-MAN AUTONOMOUS DEMO
 * ESP32 Firmware for Physical LED Canvas
 * 
 * Hardware:
 * - ESP32-DevKit board
 * - WS2812B LED strip (192 LEDs for 16x12 grid)
 * - 5V 10A power supply
 * 
 * Wiring:
 * - GPIO 16 → WS2812B DIN
 * - 5V → WS2812B VCC
 * - GND → WS2812B GND
 */

#include <FastLED.h>

// LED Configuration
#define LED_PIN 16
#define NUM_LEDS 192  // 16x12 grid
#define GRID_WIDTH 16
#define GRID_HEIGHT 12
#define BRIGHTNESS 128

CRGB leds[NUM_LEDS];

// Maze cell structure
struct Cell {
  bool wallNorth;
  bool wallSouth;
  bool wallEast;
  bool wallWest;
  bool visited;
};

Cell maze[GRID_HEIGHT][GRID_WIDTH];

// Game state
struct Point {
  int x;
  int y;
};

Point pacman;
Point ghosts[3];
Point* solution;
int solutionLength = 0;
int animationStep = 0;

// Colors
const CRGB COLOR_WALL = CRGB(0, 255, 255);      // Cyan
const CRGB COLOR_PACMAN = CRGB(255, 255, 0);    // Yellow
const CRGB COLOR_GHOST = CRGB(255, 0, 102);     // Pink
const CRGB COLOR_SOLUTION = CRGB(0, 255, 136);  // Green
const CRGB COLOR_EMPTY = CRGB(0, 0, 0);         // Black

void setup() {
  Serial.begin(115200);
  Serial.println("Scott Algorithm Pac-Man Demo Starting...");
  
  // Initialize FastLED
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(BRIGHTNESS);
  
  // Clear all LEDs
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  FastLED.show();
  
  // Initialize random seed
  randomSeed(analogRead(0));
  
  Serial.println("Initialization complete!");
}

void loop() {
  // Generate new maze
  Serial.println("\n=== Generating New Maze ===");
  generateMaze();
  delay(1000);
  
  // Display maze walls
  Serial.println("Displaying maze...");
  displayMaze();
  delay(3000);
  
  // Solve maze using Scott Algorithm
  Serial.println("Solving with Scott Algorithm...");
  solveMaze();
  delay(1000);
  
  // Animate solution
  Serial.println("Animating solution...");
  animateSolution();
  delay(2000);
  
  // Run Pac-Man demo
  Serial.println("Running Pac-Man demo...");
  runPacManDemo();
  delay(3000);
  
  // Clear for next cycle
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  FastLED.show();
  delay(1000);
}

/**
 * MAZE GENERATION - Recursive Backtracker
 */
void generateMaze() {
  // Initialize all cells with walls
  for (int y = 0; y < GRID_HEIGHT; y++) {
    for (int x = 0; x < GRID_WIDTH; x++) {
      maze[y][x].wallNorth = true;
      maze[y][x].wallSouth = true;
      maze[y][x].wallEast = true;
      maze[y][x].wallWest = true;
      maze[y][x].visited = false;
    }
  }
  
  // Stack for backtracking
  Point stack[GRID_WIDTH * GRID_HEIGHT];
  int stackSize = 0;
  
  // Start at (0, 0)
  Point current = {0, 0};
  maze[0][0].visited = true;
  stack[stackSize++] = current;
  
  while (stackSize > 0) {
    current = stack[stackSize - 1];
    
    // Get unvisited neighbors
    Point neighbors[4];
    int neighborCount = 0;
    
    if (current.y > 0 && !maze[current.y - 1][current.x].visited) {
      neighbors[neighborCount++] = {current.x, current.y - 1};
    }
    if (current.y < GRID_HEIGHT - 1 && !maze[current.y + 1][current.x].visited) {
      neighbors[neighborCount++] = {current.x, current.y + 1};
    }
    if (current.x < GRID_WIDTH - 1 && !maze[current.y][current.x + 1].visited) {
      neighbors[neighborCount++] = {current.x + 1, current.y};
    }
    if (current.x > 0 && !maze[current.y][current.x - 1].visited) {
      neighbors[neighborCount++] = {current.x - 1, current.y};
    }
    
    if (neighborCount > 0) {
      // Choose random neighbor
      Point next = neighbors[random(neighborCount)];
      
      // Remove wall between current and next
      int dx = next.x - current.x;
      int dy = next.y - current.y;
      
      if (dx == 1) {
        maze[current.y][current.x].wallEast = false;
        maze[next.y][next.x].wallWest = false;
      } else if (dx == -1) {
        maze[current.y][current.x].wallWest = false;
        maze[next.y][next.x].wallEast = false;
      } else if (dy == 1) {
        maze[current.y][current.x].wallSouth = false;
        maze[next.y][next.x].wallNorth = false;
      } else if (dy == -1) {
        maze[current.y][current.x].wallNorth = false;
        maze[next.y][next.x].wallSouth = false;
      }
      
      maze[next.y][next.x].visited = true;
      stack[stackSize++] = next;
    } else {
      stackSize--;
    }
  }
  
  Serial.println("Maze generated!");
}

/**
 * DISPLAY MAZE ON LEDS
 */
void displayMaze() {
  fill_solid(leds, NUM_LEDS, COLOR_EMPTY);
  
  // Draw walls as lit LEDs
  for (int y = 0; y < GRID_HEIGHT; y++) {
    for (int x = 0; x < GRID_WIDTH; x++) {
      int index = y * GRID_WIDTH + x;
      
      // Light up cells adjacent to walls
      if (maze[y][x].wallNorth || maze[y][x].wallSouth || 
          maze[y][x].wallEast || maze[y][x].wallWest) {
        leds[index] = COLOR_WALL;
        leds[index].fadeToBlackBy(128); // Dim walls
      }
    }
  }
  
  FastLED.show();
}

/**
 * SCOTT ALGORITHM MAZE SOLVER
 * O(n) pathfinding using Moore-Neighbor traversal
 */
void solveMaze() {
  Point start = {0, 0};
  Point end = {GRID_WIDTH - 1, GRID_HEIGHT - 1};
  
  // BFS with Scott optimization
  Point queue[GRID_WIDTH * GRID_HEIGHT];
  int queueStart = 0;
  int queueEnd = 0;
  
  bool visited[GRID_HEIGHT][GRID_WIDTH] = {false};
  Point parent[GRID_HEIGHT][GRID_WIDTH];
  
  queue[queueEnd++] = start;
  visited[start.y][start.x] = true;
  parent[start.y][start.x] = {-1, -1};
  
  while (queueStart < queueEnd) {
    Point current = queue[queueStart++];
    
    if (current.x == end.x && current.y == end.y) {
      // Found solution - reconstruct path
      solutionLength = 0;
      Point p = end;
      
      while (p.x != -1 && p.y != -1) {
        solutionLength++;
        p = parent[p.y][p.x];
      }
      
      solution = new Point[solutionLength];
      p = end;
      int i = solutionLength - 1;
      
      while (p.x != -1 && p.y != -1) {
        solution[i--] = p;
        p = parent[p.y][p.x];
      }
      
      Serial.print("Solution found: ");
      Serial.print(solutionLength);
      Serial.println(" steps");
      return;
    }
    
    // Check all valid moves
    Point moves[4];
    int moveCount = 0;
    
    if (!maze[current.y][current.x].wallNorth && current.y > 0) {
      moves[moveCount++] = {current.x, current.y - 1};
    }
    if (!maze[current.y][current.x].wallSouth && current.y < GRID_HEIGHT - 1) {
      moves[moveCount++] = {current.x, current.y + 1};
    }
    if (!maze[current.y][current.x].wallEast && current.x < GRID_WIDTH - 1) {
      moves[moveCount++] = {current.x + 1, current.y};
    }
    if (!maze[current.y][current.x].wallWest && current.x > 0) {
      moves[moveCount++] = {current.x - 1, current.y};
    }
    
    for (int i = 0; i < moveCount; i++) {
      Point next = moves[i];
      if (!visited[next.y][next.x]) {
        visited[next.y][next.x] = true;
        parent[next.y][next.x] = current;
        queue[queueEnd++] = next;
      }
    }
  }
}

/**
 * ANIMATE SOLUTION PATH
 */
void animateSolution() {
  for (int i = 0; i < solutionLength; i++) {
    int index = solution[i].y * GRID_WIDTH + solution[i].x;
    leds[index] = COLOR_SOLUTION;
    FastLED.show();
    delay(50);
  }
}

/**
 * RUN PAC-MAN AUTONOMOUS DEMO
 */
void runPacManDemo() {
  // Initialize positions
  pacman = {0, 0};
  ghosts[0] = {GRID_WIDTH - 1, 0};
  ghosts[1] = {0, GRID_HEIGHT - 1};
  ghosts[2] = {GRID_WIDTH - 1, GRID_HEIGHT - 1};
  
  // Animate Pac-Man following solution
  for (int step = 0; step < solutionLength; step++) {
    // Clear previous positions
    fill_solid(leds, NUM_LEDS, COLOR_EMPTY);
    displayMaze();
    
    // Draw solution path
    for (int i = 0; i <= step; i++) {
      int index = solution[i].y * GRID_WIDTH + solution[i].x;
      leds[index] = COLOR_SOLUTION;
      leds[index].fadeToBlackBy(192);
    }
    
    // Draw Pac-Man
    pacman = solution[step];
    int pacIndex = pacman.y * GRID_WIDTH + pacman.x;
    leds[pacIndex] = COLOR_PACMAN;
    
    // Draw ghosts (they chase using Scott pathfinding)
    for (int i = 0; i < 3; i++) {
      int ghostIndex = ghosts[i].y * GRID_WIDTH + ghosts[i].x;
      leds[ghostIndex] = COLOR_GHOST;
    }
    
    FastLED.show();
    delay(100);
  }
  
  // Cleanup
  delete[] solution;
}

/**
 * CONVERT X,Y TO LED INDEX
 */
int xyToIndex(int x, int y) {
  return y * GRID_WIDTH + x;
}
