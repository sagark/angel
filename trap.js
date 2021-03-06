// trap handling

function handle_trap(trap){
    //first, need to check ET bit. if it is not one, processor enters ERROR
    //mode (throw new RISCVError("ERROR");)
    if ((RISCV.priv_reg[PCR["PCR_SR"]["num"]] & SR["SR_EI"]) == 0x0) {
        // this means exceptions are disabled
        // enter ERROR mode:
        throw new RISCVError("Exceptions are Disabled but Trap Occurred, Terminating");
    } 
    console.log("Trap occurred at 0x" + RISCV.pc.toString(16));
    console.log(stringIntHex(RISCV.load_word_from_mem(RISCV.pc)));

    // store exception code to cause register
    var trapec = trap.exceptionCode;
    var causeLong = new Long(trap.exceptionCode, trap.interruptBit << 31);
    RISCV.priv_reg[PCR["PCR_CAUSE"]["num"]] = causeLong;

    var oldsr = RISCV.priv_reg[PCR["PCR_SR"]["num"]];
    // set SR[PS] = SR[S]
    if ((oldsr & SR["SR_S"]) != 0) {
        // S is set
        oldsr = oldsr | SR["SR_PS"];
    } else {
        oldsr = oldsr & (~SR["SR_PS"]);
    }

    if ((oldsr & SR["SR_EI"]) != 0) {
        oldsr = oldsr | SR["SR_PEI"];
    } else {
        oldsr = oldsr & (~SR["SR_PEI"]);
    }

    // set S to 1 - enable supervisor
    oldsr = oldsr | SR["SR_S"];

    // set EI to 0
    oldsr = oldsr & (~SR["SR_EI"]);

    // store modified SR
    RISCV.priv_reg[PCR["PCR_SR"]["num"]] = oldsr;

    // if trap is load/store misaligned address or access fault, 
    // set badvaddr to faulting address
    if (trapec == 0x8 || trapec == 0x9 || trapec == 0xA || trapec == 0xB) {
        RISCV.priv_reg[PCR["PCR_BADVADDR"]["num"]] = new Long(trap.memaddr, 0x0);
    }

    // store original PC (addr of inst causing exception) to epc reg
    RISCV.priv_reg[PCR["PCR_EPC"]["num"]] = new Long(RISCV.pc, 0x0);

    // set PC = to value in evec register
    RISCV.pc = RISCV.priv_reg[PCR["PCR_EVEC"]["num"]].getLowBits();

}
