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
	undef(value: any) {
		return value === undefined || value === null;
	}

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
			if(this.undef(config.type))				{ config.type = Constants.DEBUGGER_TYPE; }
			if(this.undef(config.name))				{ config.name = 'Debug ${file}'; }
			if(this.undef(config.request)) 			{ config.request = 'launch'; }
			if(this.undef(config.program)) 			{ config.program = '${file}'; }
			if(this.undef(config.octave))			{ config.octave = Constants.DEFAULT_EXECUTABLE; }
			if(this.undef(config.sourceFolder))		{ config.sourceFolder = '${workspaceFolder}'; }
			if(this.undef(config.autoTerminate))	{ config.autoTerminate = true; }
		}

		return config;
	}
}
