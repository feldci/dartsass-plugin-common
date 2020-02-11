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
import { ISassCompiler } from './compiler';
import { getWatchTargetDirectory, getWatchMinifiedTargetDirectory } from './target';

function doSingleLaunch(compiler: ISassCompiler, srcdir: string, projectRoot: string,
    config: CompilerConfig, minified: boolean, _log: ILog): Promise<ProcessOutput> {
    return compiler.watch(srcdir, projectRoot, config, minified, _log);
}

function doMinifiedLaunch(compiler: ISassCompiler, srcdir: string, projectRoot: string,
    config: CompilerConfig, _log: ILog): Promise<ProcessOutput> {
    const targetDirectory = getWatchTargetDirectory(srcdir, config);
    const targetMinifiedDirectory = getWatchMinifiedTargetDirectory(srcdir, config);
    if (targetDirectory !== targetMinifiedDirectory) {
        return doSingleLaunch(compiler, srcdir, projectRoot, config, true, _log);
    } else {
        _log.appendLine(`Warning: Failed to launch watcher for minified files since targetMinifiedDirectory \
            ${targetMinifiedDirectory} same as targetDirectory ${targetDirectory}. Check if property targetMinifiedDirectory is set and not same as targetDirectory property. `);
        return new Promise<ProcessOutput>(function(resolve, reject) {
            const processOutput: ProcessOutput = {
                pid: 0,
                killed: false
            }
            resolve(processOutput);
        });
    }
}

export class Watcher {

    watchList: Map<string, Array<number>>  = new Map<string, Array<number>>();

    constructor() {
    }


    doLaunch(_srcdir: string, projectRoot: string, config: CompilerConfig, _log: ILog): Promise<string> {
        const srcdir =  xformPath(projectRoot, _srcdir);
        const compiler = getCurrentCompiler(config, _log);
        const self = this;
        return new Promise<string>(function(resolve, reject) {
            const pids = self.watchList.get(srcdir);
            if (pids !== null && pids !== undefined) {
                reject(`${srcdir} already being watched ( pids ${pids} )`);
                return;
            }
            doSingleLaunch(compiler, srcdir, projectRoot, config, false, _log).then(
                (value: ProcessOutput) => {
                    if (value.killed) {
                        reject(`Unable to launch sass watcher for ${srcdir}. process killed. Please check sassBinPath property.`);
                        return;
                    }
                    if (value.pid === undefined || value.pid === null || value.pid <= 0) {
                        self.watchList.delete(srcdir);
                        reject(`Unable to launch sass watcher for ${srcdir}. pid is undefined. Please check sassBinPath property.`);
                        return;
                    }
                    const pid1 = value.pid;
                    self.watchList.set(srcdir, [pid1]);
                    if (config.disableMinifiedFileGeneration) {
                        resolve(`Done`);
                        return;
                    }
                    doMinifiedLaunch(compiler, srcdir, projectRoot, config, _log).then(
                            (value2: ProcessOutput) => {
                                if (value2.killed || value2.pid === undefined || value.pid === null) {
                                    killProcess(pid1, _log);
                                    self.watchList.delete(srcdir);
                                    reject(`Unable to launch minified sass watcher for ${srcdir}. process killed - ${value2.killed} / pid (${value2.pid} is null/undefined. `);
                                    return;
                                }
                                if (value2.pid > 0) {
                                    self.watchList.set(srcdir, [pid1, value2.pid]);
                                    resolve(`Good`);
                                } else {
                                    resolve(`Failed to launch watcher for minified files since targetMinifiedDirectory is the same as targetDirectory for ${srcdir}`);
                                }
                            },
                            err => {
                                killProcess(pid1, _log);
                                self.watchList.delete(srcdir);
                                reject(`${srcdir} - ${err}`);
                            }
                    );
                },
                err => {
                    reject(`${srcdir} - ${err}`);
                }
            );
        });
    }

    public ClearWatchDirectory(srcdir: string, _log: ILog) : boolean {
        const pids = this.watchList.get(srcdir);
        let cleared = false;
        if (pids !== null && pids !== undefined) {
            pids.forEach(function(value: number) {
                killProcess(value, _log);
                cleared = true;
                _log.appendLine(`About to unwatch ${srcdir} with pid ${value}`);
            });
        } else {
            _log.appendLine(`About to unwatch ${srcdir}. But no watcher launched earlier`);
            cleared = true;
        }
        this.watchList.delete(srcdir);
        return cleared;
    }

    public ClearWatch(_srcdir: string, projectRoot: string, _log: ILog): boolean {
        const srcdir = xformPath(projectRoot, _srcdir);
        return this.ClearWatchDirectory(srcdir, _log);
    }

    public ClearAll(_log: ILog) {
        this.watchList.forEach((pids: Array<number>, key: string) => {
            pids.forEach(function(value: number) {
                _log.appendLine(`Unwatching ${key} with pid ${value}`);
                killProcess(value, _log);
            });
        });
        this.watchList.clear();
    }

    /**
     * Relaunch relaunches all the watch processes for the watch directories
     */
    public Relaunch(projectRoot: string, config: CompilerConfig, _log: ILog) : Array<Promise<string>> {
        this.ClearAll(_log);
        const promises = new Array<Promise<string>>();
        for (const _srcdir of config.watchDirectories) {
            promises.push(this.doLaunch(_srcdir, projectRoot, config, _log));
        }
        return promises;
    }

    public GetWatchList(): Map<string, Array<number>> {
        return this.watchList;
    }

}

export function watchDirectory(srcdir: string, config: CompilerConfig) : Promise<boolean> {
    return  new Promise<boolean>(function(resolve, reject) {
        for(const watchDir of config.watchDirectories) {
            if (watchDir === srcdir) {
                resolve(false);
                return;
            }
        }
        config.watchDirectories.push(srcdir);
        resolve(true);
    });
}

export function unwatchDirectory(srcdir: string, config: CompilerConfig) : Promise<string> {
    return  new Promise<string>(function(resolve, reject) {
        for(var i = 0; i < config.watchDirectories.length; ++i) {
            if (config.watchDirectories[i] === srcdir) {
                config.watchDirectories.splice(i, 1);
                resolve(`${srcdir} unwatched successfully`);
                return;
            }
        }
        reject(`${srcdir} not being watched before`);
    });
}

