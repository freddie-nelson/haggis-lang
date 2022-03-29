import { close, closeSync, openSync, readFileSync, readSync, writeFileSync } from "fs";
import { RecieveStmt } from "../../../ast/Stmt";
import Token from "../../../scanning/Token";
import { TokenType } from "../../../scanning/TokenType";
import RuntimeError from "../../RuntimeError";
import HaggisString from "../../values/HaggisString";
import { FileHandler } from "../IODevices";

interface File {
  fd: number;
  line: number;
}

const openFiles = new Map<string, File>();

export default <FileHandler>{
  async create(file) {
    const path = file.jsString();

    try {
      writeFileSync(path, "");
    } catch (error) {
      throw new RuntimeError(
        new Token(TokenType.IDENTIFIER, path, undefined, -1, -1),
        `Could not create file, '${path}'.`
      );
    }
  },
  async open(file) {
    const path = file.jsString();

    if (openFiles.has(path))
      throw new RuntimeError(
        new Token(TokenType.IDENTIFIER, path, undefined, -1, -1),
        `'${path}' is already open.`
      );

    try {
      openFiles.set(path, { fd: openSync(path, "r+"), line: 0 });
    } catch (error) {
      throw new RuntimeError(
        new Token(TokenType.IDENTIFIER, path, undefined, -1, -1),
        `Failed to open '${path}'.`
      );
    }
  },
  async close(file) {
    const path = file.jsString();

    if (!openFiles.has(path))
      throw new RuntimeError(
        new Token(TokenType.IDENTIFIER, path, undefined, -1, -1),
        `'${path}' is not open.`
      );

    try {
      closeSync(openFiles.get(path).fd);
      openFiles.delete(path);
    } catch (error) {
      throw new RuntimeError(
        new Token(TokenType.IDENTIFIER, path, undefined, -1, -1),
        `Failed to close '${path}'.`
      );
    }
  },
  async closeAll() {
    for (const [path, file] of openFiles) {
      await this.close(path);
    }
  },

  async send(value, dest) {
    if (!openFiles.has(dest))
      throw new RuntimeError(
        new Token(TokenType.IDENTIFIER, dest, undefined, -1, -1),
        `'${dest}' is not open.`
      );

    try {
      const file = openFiles.get(dest);
      let data = readFileSync(file.fd, "utf-8");
      if (!data.endsWith("\n")) data += "\n";

      data += value.toString().jsString();
      writeFileSync(file.fd, data);
    } catch (error) {
      throw new RuntimeError(
        new Token(TokenType.IDENTIFIER, dest, undefined, -1, -1),
        `Failed to write to file, '${dest}'.`
      );
    }
  },
  async recieve(sender) {
    if (!openFiles.has(sender))
      throw new RuntimeError(
        new Token(TokenType.IDENTIFIER, sender, undefined, -1, -1),
        `'${sender}' is not open.`
      );

    try {
      const file = this.openFiles.get(sender);
      const data = readFileSync(file.fd, "utf-8").split("\n");

      return new HaggisString(data[file.line++]);
    } catch (error) {
      throw new RuntimeError(
        new Token(TokenType.IDENTIFIER, sender, undefined, -1, -1),
        `Could not read from file '${sender}'.`
      );
    }
  },
};
