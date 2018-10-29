/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import {
	WorkspaceFolder,
	DebugConfiguration,
	ProviderResult,
	CancellationToken
} from 'vscode';
import * as Constants from './Constants';


//******************************************************************************
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand(
		'extension.' + Constants.MODULE_NAME + '.getProgramName', config => {
		return vscode.window.showInputBox({
			placeHolder: "Please enter the name of a matlab source file in the workspace folder",
			value: "main"
		});
	}));

	// register a configuration provider for the module debug type
	context.subscriptions.push(
		vscode.debug.registerDebugConfigurationProvider(
			Constants.MODULE_NAME,
			new OctaveDebuggerConfigurationProvider()));
}


//******************************************************************************
export function deactivate() {
	// nothing to do
}


//******************************************************************************
class OctaveDebuggerConfigurationProvider implements vscode.DebugConfigurationProvider {
	/**
	 * Massage a debug configuration just before a debug session is being launched,
	 * e.g. add all missing attributes to the debug configuration.
	 */
	resolveDebugConfiguration(	folder: WorkspaceFolder | undefined,
								config: DebugConfiguration,
								token?: CancellationToken)
		: ProviderResult<DebugConfiguration>
	{
		// if launch.json is missing or empty
		if(!config.type && !config.request && !config.name) {
			const editor = vscode.window.activeTextEditor;
			if(editor && editor.document.languageId === Constants.LANGUAGE) {
				config.type = Constants.DEBUGGER_TYPE;
				config.name = 'Launch';
				config.request = 'launch';
				config.program = '${file}';
				config.octave = Constants.DEFAULT_EXECUTABLE;
				config.sourceFolder = '${workspaceFolder}';
				config.stopOnEntry = false; // Not sure if this can be supported. Must search.
				config.prefetchCount = Constants.CHUNKS_PREFETCH;
			}
		}

		if(!config.program) {
			return vscode.window.showInformationMessage("Select the main file.").then(_ => {
				return undefined; // abort launch
			});
		}

		return config;
	}
}
