// Copyright (c) 2018-19 MalvaHQ
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

'use strict';

import { CompilerConfig } from './config';
import { ILog } from './log';
import { ProcessOutput, killProcess } from './run';
import { xformPath } from './util';
import { getCurrentCompiler } from './select';

export class Watcher {

    watchList: Map<string, number>  = new Map<string, number>();

    constructor() {
    }

    public Watch(_srcdir: string, projectRoot: string, config: CompilerConfig, _log: ILog): Promise<string> {
        const srcdir = xformPath(projectRoot, _srcdir);
        const self = this;
        return new Promise<string>(function(resolve, reject) {
            getCurrentCompiler(config, _log).watch(srcdir, projectRoot, config, _log).then(
                (value: ProcessOutput) => {
                    self.watchList.set(srcdir, value.pid);
                    resolve('Good');
                },
                err => reject(err)
            );
        });
    }

    public ClearWatch(_srcdir: string, projectRoot: string) {
        const srcdir = xformPath(projectRoot, _srcdir);
        const pid = this.watchList.get(srcdir);
        if (pid !== null && pid !== undefined) {
            killProcess(pid);
        }
        this.watchList.delete(srcdir);
    }

    public ClearAll(projectRoot: string) {
        const self = this;
        this.watchList.forEach((value: number, key: string) => {
            self.ClearWatch(key, projectRoot);
        });
    }

    doVerifyProcess(pid: number): boolean {
        // TODO: Check if the pid is still running so it can be cleaned up
        return true;
    }

    /**
     * Refresh verifies if the processes represented by the PID are still running.
     *
     * Returns the number of processes that do not run anymore.
     */
    public Refresh(): number {
        const self = this;
        let count = 0;
        this.watchList.forEach((value: number, key: string) => {
            if (!self.doVerifyProcess(value)) {
                self.watchList.delete(key);
                // Since process is not running anymore just delete it from the watch list
                count++;
            }
        });
        return count;
    }

    public GetWatchList(): Map<string, number> {
        return this.watchList;
    }

}