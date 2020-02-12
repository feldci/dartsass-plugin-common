// Copyright (c) 2019 MalvaHQ
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

'use strict';
import { isMinCSS, isCSSFile  } from './target';

import chokidar, { FSWatcher } from 'chokidar';
import { ILog } from './log';

export function getIgnoreFunction(_log: ILog): (docPath: string) => any {
    return (docPath: string) => {
        _log.debug(`Checking if we can ignore ${docPath}`);
        if (!isCSSFile(docPath)) {
            return true;
        }
        if (isMinCSS(docPath)) {
            return true;
        }
        return false;
    };
}

export function cwatchCSS(pattern: string, fnOnFile: (docPath: string)=>any , fnOnDeleteFile: (docPath: string)=> any, _log: ILog) : FSWatcher {
    const watcher = chokidar.watch(pattern, {
        persistent: true,
    });
    // Add event listeners.
    watcher
    .on('add', docPath => fnOnFile(docPath))
    .on('change', docPath => fnOnFile(docPath))
    .on('unlink', docPath => fnOnDeleteFile(docPath));
    return watcher;
}

export function closeCWatcher(watcher: FSWatcher, _log: ILog) {
    watcher.close().then(
        () => {
            _log.debug(`Closed a FSWatcher`);
        }
    );
}