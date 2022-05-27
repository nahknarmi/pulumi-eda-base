import * as aws from "@pulumi/aws";
import {Subnet, Vpc} from "@pulumi/aws/ec2";

let availabilityZones = aws.getAvailabilityZones({state: "available"});
let vpc = new Vpc("vpc", {cidrBlock: "192.168.0.0/22"});

let subnetAz1 = new Subnet("subnetAz1", {
    availabilityZone: availabilityZones.then(azs => azs.names[0]),
    cidrBlock: "192.168.0.0/24",
    vpcId: vpc.id
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