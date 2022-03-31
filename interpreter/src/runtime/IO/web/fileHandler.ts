import Token from "../../../scanning/Token";
import { TokenType } from "../../../scanning/TokenType";
import RuntimeError from "../../RuntimeError";
import { FileHandler } from "../IODevices";

interface File {
  fd: number;
  line: number;
}

const openFiles = new Map<string, File>();

export default <FileHandler>{
  async create(file) {
    const path = file.jsString();

    throw new RuntimeError(
      new Token(TokenType.IDENTIFIER, path, undefined, -1, -1),
      `Cannot use the filesystem from the playground.`
    );
  },
  async open(file) {
    const path = file.jsString();

    throw new RuntimeError(
      new Token(TokenType.IDENTIFIER, path, undefined, -1, -1),
      `Cannot use the filesystem from the playground.`
    );
  },
  async close(file) {
    const path = file.jsString();

    throw new RuntimeError(
      new Token(TokenType.IDENTIFIER, path, undefined, -1, -1),
      `Cannot use the filesystem from the playground.`
    );
  },
  async closeAll() {
    return;
  },

  async send(value, dest) {
    const path = dest;

    throw new RuntimeError(
      new Token(TokenType.IDENTIFIER, path, undefined, -1, -1),
      `Cannot use the filesystem from the playground.`
    );
  },
  async receive(sender) {
    const path = sender;

    throw new RuntimeError(
      new Token(TokenType.IDENTIFIER, path, undefined, -1, -1),
      `Cannot use the filesystem from the playground.`
    );
  },
};
