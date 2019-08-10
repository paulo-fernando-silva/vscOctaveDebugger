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
			placeHolder: "Enter the name of a matlab function to debug",
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
	resolveDebugConfiguration(
		folder: WorkspaceFolder | undefined,
		config: DebugConfiguration,
		token?: CancellationToken
	) : ProviderResult<DebugConfiguration>
	{
		const editor = vscode.window.activeTextEditor;
		if(editor && editor.document.languageId === Constants.LANGUAGE) {
			if(!config.type)			{ config.type = Constants.DEBUGGER_TYPE; }
			if(!config.name)			{ config.name = 'Debug ${file}'; }
			if(!config.request) 		{ config.request = 'launch'; }
			if(!config.program) 		{ config.program = '${file}'; }
			if(!config.octave)			{ config.octave = Constants.DEFAULT_EXECUTABLE; }
			if(!config.sourceFolder)	{ config.sourceFolder = '${workspaceFolder}'; }
		}

		return config;
	}
}
