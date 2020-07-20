// Copyright (c) 2019 MalvaHQ
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

"use strict";
import { CompilerConfig } from "./config";
import { ILog } from "./log";
import { IDocument } from "./document";
import { validateDocument } from "./validate";
import { validateTargetDirectories } from "./target";
import { getCurrentCompiler } from "./select";

export async function CompileCurrentFile(
  document: IDocument,
  extensionConfig: CompilerConfig,
  _log: ILog
): Promise<string> {
  if (!validateDocument(document, extensionConfig, _log)) {
    return '';
  }
  const err = validateTargetDirectories(document, extensionConfig);
  if (err) {
    throw new Error(err);
  }
  _log.debug(`About to compile current file: ${document.getFileName()}`);
  return getCurrentCompiler(extensionConfig, _log).compileDocument(
    document,
    extensionConfig,
    _log
  );
}

export function SayVersion(
  extensionConfig: CompilerConfig,
  projectRoot: string,
  _log: ILog
): Promise<string> {
  return getCurrentCompiler(extensionConfig, _log).sayVersion(
    extensionConfig,
    projectRoot,
    _log
  );
}

export function Validate(
  extensionConfig: CompilerConfig,
  projectRoot: string,
  _log: ILog
): Promise<string> {
  return getCurrentCompiler(extensionConfig, _log).validate(
    extensionConfig,
    projectRoot
  );
}
