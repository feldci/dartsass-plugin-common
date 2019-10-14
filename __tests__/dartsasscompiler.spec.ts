// Copyright (c) 2019 MalvaHQ
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

'use strict';
import { expect } from 'chai';
import 'mocha';
import { DartSassCompiler } from '../src/dartsasscompiler';
import { IDocument } from '../src/document';
import { CompilerConfig } from '../src/config';
import { validateTargetDirectories } from '../src/target';
import { getDocumentForFile} from './document';
import { getNullLog, getBufLog } from './log';

describe('DartsassCompiler SayVersion' , () => {

    it('sayVersion', () => {
        const compiler = new DartSassCompiler();
        const config = new CompilerConfig();
        config.sassBinPath = "/usr/local/bin/sass";
        const _log = getBufLog();
        compiler.sayVersion(config, _log).then(
            function(data: any) {
                // This value comes from the version installed using Dockerfile. Hence hardcoded. YMMV locally.
                expect(data).to.equal('dart-sass\t1.23.0\t(Sass Compiler)\t[Dart]\ndart2js\t2.5.1\t(Dart Compiler)\t[Dart]');
            },
            function(err: any) {
                expect(err).to.be.not.null;
            }
        );
    });
});

describe('DartsassCompiler CompileDocument' , () => {

    it('DartsassCompiler::compileDocument', () => {
        const compiler = new DartSassCompiler();
        const document: IDocument = getDocumentForFile('hello.scss');
        const config = new CompilerConfig();
        config.targetDirectory = 'out';
        const _log = getNullLog();
        expect(validateTargetDirectories(document, config)).to.be.null;
        compiler.compileDocument(document, config, _log).then(
            result => {
                expect(result).to.equal('/tmp/web/__tests__/out/hello.min.css');
            },
            err => {
                expect(err).to.be.null;
            }
        )
    });
});

describe('DartsassCompiler Which' , () => {

    it('DartsassCompiler:which', () => {
        const compiler = new DartSassCompiler();
        const config = new CompilerConfig();
        const _log = getNullLog();
        compiler.which(config, _log).then(
            result => {
                expect(result).to.equal('dart-sass\t1.23.0\t(Sass Compiler)\t[Dart]\ndart2js\t2.5.1\t(Dart Compiler)\t[Dart]');
            },
            err => {
                expect(err).to.be.null;
            }
        )
    });
});