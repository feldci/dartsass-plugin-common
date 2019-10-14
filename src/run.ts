// Copyright (c) 2018-19 MalvaHQ
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
'use strict';
import { ILog } from './log';
import * as child from 'child_process';
import { SIGINT } from 'constants';

export interface ProcessOutput {
    code: number;

    pid: number;
}

export function Run(cmd: string, args: string[], _log: ILog) : Promise<string> {
    return new Promise(function(resolve, reject) {
        var output = '';
        var prc = child.spawn(cmd,  args);
        prc.stdout.setEncoding('utf8');
        prc.stdout.on('data', function(data: any) {
            output = data;
        });
        prc.stderr.setEncoding('utf8');
        prc.stderr.on('data', function(data: any) {
            _log.appendLine(data);
        });
        prc.on('exit', function(code: any) {
            if (code === 0) {
                resolve(removeLineBreaks(output));
            } else {
                reject(code);
            }
        });
    })
}

export function RunDetached(cmd: string, args: string[], _log: ILog) : Promise<ProcessOutput> {
    return new Promise(function(resolve, reject) {
        const prc = child.spawn(cmd,  args, {
            detached: true,
            shell: true,
            stdio: 'ignore'
        });
        // and unref() somehow disentangles the child's event loop from the parent's:
        prc.unref();
        _log.appendLine(`Detached process ${cmd} launched with pid ${prc.pid}`);
        if (prc.stdout) {
            prc.stdout.setEncoding('utf8');
            prc.stdout.on('data', function(data: any) {
                _log.appendLine(`Output: ${data}`);
            });
        }
        if (prc.stderr) {
            prc.stderr.setEncoding('utf8');
            prc.stderr.on('data', function(data: any) {
                _log.appendLine(`Error: ${data}`);
            });
        }
        const processOutput: ProcessOutput = {
            code: 0,
            pid: prc.pid
        }
        resolve(processOutput);
    })
}

export function removeLineBreaks(value: string): string {
    return value.replace(/(\r\n|\n|\r)/gm, "");
}

export function killProcess(pid: number): Promise<string> {
    return new Promise(function(resolve, reject) {
        process.kill(-pid, SIGINT);
    });
}