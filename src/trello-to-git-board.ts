import { blue, green, red } from 'colors';
import { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { FileNotFound } from './errors/file-not-found.error';
import { GithubImport } from './types/github-import.type';
import { TrelloExport } from './types/trello-export.type';
import { TrelloGithubMap } from './types/trello-github-map.type';
import { GithubUploaderUtil } from './utils/github-uploader.util';
import { TrelloGithubMapperUtil } from './utils/trello-github-mapper.util';
import { TrelloParserUtil } from './utils/trello-parser.util';
const program = new Command();

const readingOptions = { encoding: 'utf-8' };

process.on('unhandledRejection', (error: any) => {
    if (error && error instanceof Error) {
        console.error(red(`FATAL: Error of type ${error.constructor.name} occured, message: ${error.message}, stack: ${error.stack}`));
        if (error.constructor.name === 'HttpError' && (<any> error).errors) {
            console.error(red(`Additionally the following info has been returned by Github server ${JSON.stringify((<any> error))}`));
        }
    } else {
        console.error(red(`Unknown unhandled error ${error}`));
    }
    process.exit(1);
});

// tslint:disable-next-line:no-var-requires
program.version(require('../package').version, '-v --version');

program.option('-h, --help', 'Displays help', () => {
    program.help();
});

program
    .command('parse <trelloFile>')
    .option('-m, --map-file <mapFile>', 'How to map users and lists [map.json]', 'map.json')
    .option('-o, --output-file <outputFile>', 'Where to save the github-import file, if not specified will be output.json', 'output.json')
    .action(async (trelloFile: string, command: Command) => {
        const mapFile: string = command.mapFile;
        const outputFile: string = command.outputFile;
        if (!existsSync(trelloFile)) {
            throw FileNotFound.fromFile(trelloFile);
        }
        if (mapFile && !existsSync(mapFile)) {
            throw FileNotFound.fromFile(mapFile);
        }
        const mapFileData: TrelloGithubMap = JSON.parse(readFileSync(mapFile, readingOptions));
        const trelloExport: TrelloExport = JSON.parse(readFileSync(trelloFile, readingOptions));
        const importData: GithubImport = await TrelloParserUtil.parseJson(trelloExport, mapFileData);
        const withAppliedMap: GithubImport = await TrelloGithubMapperUtil.applyMap({
            github: importData,
            trello: trelloExport,
        }, mapFileData);
        console.log(blue(`Writing output to file ${outputFile}`));
        writeFileSync(outputFile, JSON.stringify(withAppliedMap, null, 4));

    });

program
    .command('import <githubFile> <githubRepositoryUrl')
    .action(async (githubFile: string, githubRepositoryUrl: string) => {
        if (!existsSync(githubFile)) {
            throw FileNotFound.fromFile((githubFile));
        }
        const fileData: GithubImport = JSON.parse(readFileSync(githubFile, readingOptions));
        console.log(blue(`Uploading the issues to ${githubRepositoryUrl}`));
        await GithubUploaderUtil.uploadIssues(fileData, githubRepositoryUrl);
        console.log(green('Success!'));
    });
// error on unknown commands
program.on('command:*', () => {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
});
program.parse(process.argv);
