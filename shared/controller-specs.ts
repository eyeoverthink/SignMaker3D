// Controller housing specifications for various LED driver circuits

export const controllerTypes = ["555_timer", "ws2812b_esp32", "ws2812b_arduino", "attiny", "el_wire", "simple_led"] as const;
export type ControllerType = typeof controllerTypes[number];

export const powerSources = ["usb_5v", "battery_4xaa", "usb_battery_dual", "barrel_jack_12v", "screw_terminal"] as const;
export type PowerSource = typeof powerSources[number];

// Component dimensions in mm
export interface ComponentDimensions {
  width: number;
  length: number;
  height: number;
  mountingHoles?: Array<{ x: number; y: number; diameter: number }>;
}

export const componentLibrary: Record<string, ComponentDimensions> = {
  // ICs
  "555_timer_dip8": { width: 7.62, length: 9.27, height: 5 },
  "attiny85_dip8": { width: 7.62, length: 9.27, height: 5 },
  
  // Microcontrollers
  "esp32_devkit": { width: 25.4, length: 48.26, height: 12 },
  "arduino_nano": { width: 18, length: 45, height: 12 },
  
  // Transistors
  "mosfet_to220": { width: 10, length: 15, height: 5 },
  
  // Passives
  "resistor_1k": { width: 2.5, length: 6.5, height: 2.5 },
  "capacitor_0.1uf": { width: 5, length: 7, height: 5 },
  "diode_1n4148": { width: 2.5, length: 5, height: 2.5 },
  
  // Controls
  "potentiometer_50k": { width: 16, length: 16, height: 20 },
  "dpdt_switch": { width: 12, length: 19, height: 15 },
  
  // Power
  "usb_socket_female": { width: 12, length: 16, height: 8 },
  "battery_holder_4xaa": { width: 58, length: 62, height: 15 },
  "barrel_jack": { width: 14, length: 14, height: 11 },
  
  // PCB
  "projects_pcb_small": { width: 50, length: 70, height: 1.6 },
  "projects_pcb_medium": { width: 70, length: 90, height: 1.6 },
  "projects_pcb_large": { width: 90, length: 120, height: 1.6 },
};

export interface ControllerConfig {
  type: ControllerType;
  name: string;
  description: string;
  components: string[];
  powerSource: PowerSource[];
  pcbSize: "small" | "medium" | "large";
  outputConnectors: number; // Number of LED output channels
  requiresProgramming: boolean;
  voltage: string;
}

export const controllerConfigs: Record<ControllerType, ControllerConfig> = {
  "555_timer": {
    type: "555_timer",
    name: "555 Timer PWM Dimmer",
    description: "Simple analog dimmer with potentiometer control",
    components: [
      "555_timer_dip8",
      "mosfet_to220",
      "diode_1n4148",
      "diode_1n4148",
      "resistor_1k",
      "resistor_1k",
      "capacitor_0.1uf",
      "capacitor_0.1uf",
      "potentiometer_50k",
      "dpdt_switch",
      "projects_pcb_small"
    ],
    powerSource: ["usb_5v", "battery_4xaa", "usb_battery_dual"],
    pcbSize: "small",
    outputConnectors: 1,
    requiresProgramming: false,
    voltage: "5V"
  },
  
  "ws2812b_esp32": {
    type: "ws2812b_esp32",
    name: "ESP32 Addressable LED Controller",
    description: "WiFi-enabled controller for WS2812B with app control",
    components: [
      "esp32_devkit",
      "capacitor_0.1uf",
      "resistor_1k",
      "projects_pcb_medium"
    ],
    powerSource: ["usb_5v", "barrel_jack_12v"],
    pcbSize: "medium",
    outputConnectors: 3,
    requiresProgramming: true,
    voltage: "5V"
  },
  
  "ws2812b_arduino": {
    type: "ws2812b_arduino",
    name: "Arduino Nano WS2812B Controller",
    description: "Programmable controller for addressable LEDs",
    components: [
      "arduino_nano",
      "capacitor_0.1uf",
      "resistor_1k",
      "projects_pcb_small"
    ],
    powerSource: ["usb_5v", "barrel_jack_12v"],
    pcbSize: "small",
    outputConnectors: 2,
    requiresProgramming: true,
    voltage: "5V"
  },
  
  "attiny": {
    type: "attiny",
    name: "ATtiny Individual LED Controller",
    description: "Compact programmable controller for individual LEDs",
    components: [
      "attiny85_dip8",
      "resistor_1k",
      "capacitor_0.1uf",
      "projects_pcb_small"
    ],
    powerSource: ["battery_4xaa", "usb_5v"],
    pcbSize: "small",
    outputConnectors: 4,
    requiresProgramming: true,
    voltage: "3-5V"
  },
  
  "el_wire": {
    type: "el_wire",
    name: "EL Wire Inverter Housing",
    description: "Housing for AC inverter (inverter not generated)",
    components: [],
    powerSource: ["battery_4xaa"],
    pcbSize: "small",
    outputConnectors: 1,
    requiresProgramming: false,
    voltage: "3V DC to 110V AC"
  },
  
  "simple_led": {
    type: "simple_led",
    name: "Simple LED with Resistors",
    description: "Basic housing for resistor-based LED wiring",
    components: [
      "resistor_1k",
      "dpdt_switch",
      "projects_pcb_small"
    ],
    powerSource: ["battery_4xaa", "usb_5v"],
    pcbSize: "small",
    outputConnectors: 1,
    requiresProgramming: false,
    voltage: "3-5V"
  }
};

export interface ControllerHousingSettings {
  controllerType: ControllerType;
  powerSource: PowerSource;
  includeSwitch: boolean;
  includePotentiometer: boolean;
  outputConnectors: number;
  housingStyle: "compact" | "standard" | "spacious";
  mountingStyle: "screws" | "clips" | "magnets";
  ventilation: boolean;
  accessPanel: boolean;
  wallThickness: number;
  cornerRadius: number;
}

export const defaultControllerHousingSettings: ControllerHousingSettings = {
  controllerType: "555_timer",
  powerSource: "usb_battery_dual",
  includeSwitch: true,
  includePotentiometer: true,
  outputConnectors: 1,
  housingStyle: "standard",
  mountingStyle: "screws",
  ventilation: true,
  accessPanel: true,
  wallThickness: 2,
  cornerRadius: 3
};
