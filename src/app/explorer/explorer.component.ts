import { Component, ViewChild, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { ContractService } from "../_services/contract.service";
import { GraphService } from "../_services/graph.service";
import { GraphComponent } from './graph/graph.component';
import { Router } from '@angular/router';

@Component({
  styleUrls: ['./explorer.component.scss', './explorer.component.global.scss'],
  templateUrl: './explorer.component.html',
})

export class ExplorerComponent implements OnInit {
  single: any[];
  graphService: any;
  displayMethods: boolean;
  placeholder: string;
  selectedCompany: any;
  route: any;
  router: any;

  constructor(private contractService: ContractService,
              private gs: GraphService,
              private r: ActivatedRoute,
              private ro: Router) {
    this.route = r;
    this.router = ro;
    this.initialiseVariables();
    this.graphService = gs;
    this.contractService.latestBlockEvent().subscribe(
      (latestBlock: any) => {
        this.graphService.latestBlock = latestBlock.latestBlock;
      }
    );
    // Flush old state
    this.graphService.curDisplayState = this.graphService.DisplayState.noContract;
    this.graphService.badRequest = false;
  }

  ngOnInit(): void {
    this.getAddress();
  }

  getAddress(): void {
    let contractAddress = this.route.snapshot.paramMap.get('contractAddress');
    let method = this.route.snapshot.paramMap.get('method');
    if (contractAddress !== null) {
      this.exploreContract(contractAddress, method);
    }
  }

  private initialiseVariables() {
    this.placeholder = null;
    this.single = [];
    this.displayMethods = false;
  }

  exploreContract(contract: string, method: string) {
    console.log('Exploring Contract: ' + contract + ' ' +  method);
    this.graphService.curContractID = contract;
    this.contractService.exploreContract(contract).subscribe(
      (contractInfo) => {
        this.graphService.curDisplayState = this.graphService.DisplayState.newContract;

        this.graphService.methods = contractInfo.variables;

        this.graphService.methodPages = Math.ceil(this.graphService.methods.length / 4)
        this.graphService.relevantMethods = this.graphService.methods.slice(0, 4);

        if (contractInfo.contractName === null) {
          this.graphService.curContractName = 'unknown';
        } else {
          this.graphService.curContractName = contractInfo.contractName;
        }
        if (method !== null) {
          let methodInfo = this.graphService.methods.find((elem) => {
            return elem.variableName.toUpperCase() === method.toUpperCase()
          })
          this.graphService.generateDatapoints(method, methodInfo);
        }
      },
      (error) => {
        if (error.status === 400) {
          this.graphService.badRequest = true;
          this.graphService.badRequestState = this.graphService.badRequestState_.noABI
          console.log('Error in retrieving contracts')
        }
      },
      () => {
        this.placeholder = contract;
        console.log("completed contract exploring");
        this.displayMethods = true;
      }
    );
  }
  verify() {
    window.open('https://etherscan.io/verifyContract', '_blank')
  }
}
