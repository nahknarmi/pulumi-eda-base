import * as aws from "@pulumi/aws";
import {Subnet, Vpc} from "@pulumi/aws/ec2";
import * as pulumi from "@pulumi/pulumi";

let availabilityZones = aws.getAvailabilityZones({state: "available"});
let vpc = new Vpc("vpc", {cidrBlock: "192.168.0.0/22"});

let subnetAz1 = new Subnet("subnetAz1", {
    availabilityZone: availabilityZones.then(azs => azs.names[0]),
    cidrBlock: "192.168.0.0/24",
    vpcId: vpc.id,
});

let subnetAz2 = new Subnet("subnetAz2", {
    availabilityZone: availabilityZones.then(azs => azs.names[1]),
    cidrBlock: "192.168.1.0/24",
    vpcId: vpc.id
});

let subnetAz3 = new Subnet("subnetAz3", {
    availabilityZone: availabilityZones.then(azs => azs.names[3]),
    cidrBlock: "192.168.2.0/24",
    vpcId: vpc.id
});

export const vpcId = vpc.id;
export const subnetAz1Id = subnetAz1.id;
export const subnetAz2Id = subnetAz2.id;
export const subnetAz3Id = subnetAz3.id;

const ami = pulumi.output(aws.ec2.getAmi({
    filters: [{
        name: "name",
        values: ["amzn2-ami-hvm-*-x86_64-ebs"],
    }],
    owners: ["amazon"],
    mostRecent: true,
}));

const group = new aws.ec2.SecurityGroup("bastion-sg", {
    ingress: [{ protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] }],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
    vpcId: vpcId
});


const testSSMRole = new aws.iam.Role("testSSMRole", {
    assumeRolePolicy: `{
  "Version": "2012-10-17",
  "Statement": {
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }
}
`});

new aws.iam.RolePolicyAttachment("testSSMAttach", {
    policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    role: testSSMRole.name,
});

const testSSMProfile = new aws.iam.InstanceProfile("testSSMProfile", {
    name: "testSSMProfile",
    role: testSSMRole,
})

const size = "t2.micro";
const server = new aws.ec2.Instance("bastion", {
    instanceType: size,
    // securityGroups: [group.name],
    ami: ami.id,
    iamInstanceProfile: testSSMProfile,
    // vpcSecurityGroupIds: [group.id],
    // subnetId: subnetAz1Id,
    userData: `#!/bin/bash
set -ex

cd /tmp
sudo yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm
sudo systemctl enable amazon-ssm-agent
sudo systemctl start amazon-ssm-agent
`});


export const publicIp = server.publicIp;
export const publicHostName = server.publicDns;
export const instanceID = server.id;
export const groupVpcId = group.vpcId;