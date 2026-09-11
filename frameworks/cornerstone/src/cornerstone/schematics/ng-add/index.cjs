const { NodePackageInstallTask } = require('@angular-devkit/schematics/tasks');

function parse(tree, path) {
  const value = tree.read(path);
  if (!value) throw new Error(`Cornerstone could not find ${path}.`);
  return JSON.parse(value.toString('utf8'));
}

function ngAdd(options = {}) {
  return (tree, context) => {
    const workspace = parse(tree, '/angular.json');
    const projectName =
      options.project || workspace.defaultProject || Object.keys(workspace.projects || {})[0];
    const project = workspace.projects?.[projectName];
    const build = project?.architect?.build || project?.targets?.build;
    if (!build?.options)
      throw new Error(`Cornerstone could not find a build target for project "${projectName}".`);

    const styles = Array.isArray(build.options.styles) ? build.options.styles : [];
    for (const style of [
      '@quinntyne/cornerstone/styles/theme.scss',
      ...(options.compatibilityStyles ? ['@quinntyne/cornerstone/styles/compat.scss'] : []),
    ]) {
      if (!styles.some((entry) => (typeof entry === 'string' ? entry : entry.input) === style))
        styles.push(style);
    }
    build.options.styles = styles;
    tree.overwrite('/angular.json', `${JSON.stringify(workspace, null, 2)}\n`);

    const manifest = parse(tree, '/package.json');
    manifest.dependencies ||= {};
    manifest.dependencies['@angular/cdk'] ||= '^21.0.0';
    tree.overwrite('/package.json', `${JSON.stringify(manifest, null, 2)}\n`);
    if (!options.skipInstall) context.addTask(new NodePackageInstallTask());
    context.logger.info(`Configured Cornerstone UI for ${projectName}.`);
    return tree;
  };
}

module.exports = { ngAdd };
