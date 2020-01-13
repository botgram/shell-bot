if (process.platform === 'win32')
    throw new Error('unsupported platform');

import * as I from './interfaces';
import {ITermios} from './interfaces';
import * as path from 'path';
export const native: I.INative = require(path.join('..', 'build', 'Release', 'termios.node'));
const s = native.ALL_SYMBOLS;


class TermiosHelper extends native.CTermios {
    writeTo(fd: number, action?: number): void {
        if (typeof action === 'undefined')
            action = s.TCSAFLUSH;
        native.tcsetattr(fd, action, this);
    }
    loadFrom(fd: number): void {
        native.tcgetattr(fd, this);
    }
    getInputSpeed(): number {
        return native.cfgetispeed(this);
    }
    getOutputSpeed(): number {
        return native.cfgetospeed(this);
    }
    setInputSpeed(baudrate: number): void {
        native.cfsetispeed(this, baudrate);
    }
    setOutputSpeed(baudrate: number): void {
        native.cfsetospeed(this, baudrate);
    }
    setSpeed(baudrate: number): void {
        native.cfsetispeed(this, baudrate);
        native.cfsetospeed(this, baudrate);
    }
    setraw(): void {
        this.c_iflag &= ~(s.BRKINT | s.ICRNL | s.INPCK | s.ISTRIP | s.IXON);
        this.c_oflag &= ~s.OPOST;
        this.c_cflag &= ~(s.CSIZE | s.PARENB);
        this.c_cflag |= s.CS8;
        this.c_lflag &= ~(s.ECHO | s.ICANON | s.IEXTEN | s.ISIG);
        this.c_cc[s.VMIN] = 1;
        this.c_cc[s.VTIME] = 0;
    }
    setcbreak(): void {
        this.c_lflag &= ~(s.ECHO | s.ICANON);
        this.c_cc[s.VMIN] = 1;
        this.c_cc[s.VTIME] = 0;
    }
    setcooked(): void {
        this.c_iflag = s.BRKINT | s.ICRNL | s.INPCK | s.ISTRIP | s.IXON | s.IGNPAR;
        this.c_oflag = s.OPOST | s.ONLCR;
        this.c_cflag |= s.CS8;
        this.c_lflag = s.ECHOKE | s.ECHOCTL | s.ECHOK | s.ECHOE | s.ECHO | s.ICANON | s.IEXTEN | s.ISIG;
        // FIXME: set c_cc values;
    }
}

TermiosHelper.prototype.__proto__ = {};
native.CTermios.prototype.__proto__ = TermiosHelper.prototype;

export let Termios: ITermios = native.CTermios;
export {I as Interfaces};
export {ITermios};
