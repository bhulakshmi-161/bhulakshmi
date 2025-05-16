import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export const buildAnchorProgram = (rustPath) => {
  const projectDir = path.resolve('./anchor_template');
  fs.writeFileSync(path.join(projectDir, 'programs/demo/src/lib.rs'), fs.readFileSync(rustPath));

  execSync(`anchor build`, { cwd: projectDir });
  return 'demo';
};

export const deployProgram = (keypairPath, network) => {
  const soPath = './anchor_template/target/deploy/demo.so';
  const output = execSync(`solana program deploy ${soPath} --keypair ${keypairPath} --url https://${network}.solana.com`);
  const match = output.toString().match(/Program Id: (\w+)/);
  return match[1];
};

export const getIdl = () => {
  return './anchor_template/target/idl/demo.json';
};
