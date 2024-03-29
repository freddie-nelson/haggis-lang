import HaggisString from "../values/HaggisString";
import HaggisValue from "../values/HaggisValue";

export interface InputDevice<T extends HaggisValue> {
  receive(sender: string): Promise<T>;
}

export interface OutputDevice<T extends HaggisValue> {
  send(value: T, dest: string): Promise<void>;
}

export interface FileHandler extends InputDevice<HaggisString>, OutputDevice<HaggisValue> {
  create(file: HaggisString): Promise<void>;
  open(file: HaggisString): Promise<void>;
  close(file: HaggisString): Promise<void>;
  closeAll(): Promise<void>;
}

export interface IODevices {
  [index: string]: InputDevice<HaggisValue> | OutputDevice<HaggisValue> | FileHandler;

  DISPLAY: OutputDevice<HaggisValue>;
  KEYBOARD: InputDevice<HaggisString>;
  fileHandler: FileHandler;
}
