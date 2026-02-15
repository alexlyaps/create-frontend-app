#!/usr/bin/env node

import prompts from "prompts";
import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";

async function main() {
  const projectName = process.argv[2];

  if (!projectName) {
    throw new Error("Please provide a project name");
  }

  const choices = [
    { title: "React", value: "react" },
    { title: "Vue", value: "vue" },
    { title: "Svelte", value: "svelte" },
  ];

  const answers = await prompts([
    {
      type: "select",
      name: "framework",
      message: "Select framework",
      choices,
    },
    {
      type: "toggle",
      name: "typescript",
      message: "Use TypeScript?",
      initial: true,
      active: "Yes",
      inactive: "No",
    },
  ]);

  const selectedTitle = choices.find(
    (c) => c.value === answers.framework,
  )?.title;

  const root = path.resolve(process.cwd(), projectName);
  await fs.mkdir(root);

  const getDependencies = (framework: string) => {
    switch (framework) {
      case "react":
        return ["react", "react-dom"];
      case "vue":
        return ["vue"];
      case "svelte":
        return ["svelte"];
      default:
        return [];
    }
  };

  const getDevDependencies = (framework: string, typescript: boolean) => {
    switch (framework) {
      case "react":
        return typescript ? ["@types/react", "@types/react-dom"] : [];
      case "vue":
        return typescript ? ["@types/vue"] : [];
      case "svelte":
        return typescript ? ["@types/svelte"] : [];
      default:
        return [];
    }
  };

  const pkg = {
    name: projectName,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
    },

    dependencies: getDependencies(answers.framework).reduce(
      (acc, dep) => {
        acc[dep] = "latest";
        return acc;
      },
      {} as Record<string, string>,
    ),

    devDependencies: getDevDependencies(
      answers.framework,
      answers.typescript,
    ).reduce(
      (acc, dep) => {
        acc[dep] = "latest";
        return acc;
      },
      {} as Record<string, string>,
    ),
  };

  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify(pkg, null, 2),
  );

  const installAnswer = await prompts([
    {
      type: "confirm",
      name: "install",
      message: `Project ${projectName} created with ${selectedTitle}. Do you want to install dependencies now?`,
      initial: true,
    },
  ]);

  if (installAnswer.install) {
    execSync("npm install", { cwd: root, stdio: "inherit" });
  }
}

main();
