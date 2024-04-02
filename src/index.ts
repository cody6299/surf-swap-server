import { PublicKey, Connection} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { IDL } from "../../surf-swap/target/types/surf_swap";
import { TOKEN_PROGRAM_ID, getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

import {
    jsonInfo2PoolKeys,
    Liquidity,
    LiquidityPoolKeys,
    Percent,
    Token,
    TokenAmount,
    ApiPoolInfoV4,
    LIQUIDITY_STATE_LAYOUT_V4,
    MARKET_STATE_LAYOUT_V3,
    SPL_MINT_LAYOUT,
    Market,
  } from '@raydium-io/raydium-sdk';

// const connection = new Connection("https://api.devnet.solana.com");
const connection = new Connection("http://127.0.0.1:8899");
const keypair = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(os.homedir(), ".config/solana/id.json"), 'utf8'))))
const wallet = new NodeWallet(keypair);
const provider = new anchor.AnchorProvider(connection, wallet, {});
const raydiumAmmProgram = new anchor.web3.PublicKey('HWy1jotHpo6UqeQxx49dpYYdQB8wj9Qk9MdxwjLvDHB8');
const serumProgram = new anchor.web3.PublicKey('EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj');
const PROGRAM_ID = new PublicKey("6N2tst9KWHb6ARsEfEcPL35FBwHy2BSRBJeBqn7pxpbL");
const PROGRAM = new anchor.Program(
    IDL,
    PROGRAM_ID,
    provider
);

class PoolAccountInfo {
    poolAccount: PublicKey;
    ammInfo: PublicKey;
    ammAuthorityInfo: PublicKey;
    ammOpenOrderInfo: PublicKey;
    ammTargetOrdersInfo: PublicKey;
    ammCoinVaultInfo: PublicKey;
    ammPcVaultInfo: PublicKey;
    marketInfo: PublicKey;
    marketBidsInfo: PublicKey;
    marketAsksInfo: PublicKey;
    marketEventQueueInfo: PublicKey;
    marketCoinVaultInfo: PublicKey;
    marketPcVaultInfo: PublicKey;
    marketVaultSigner: PublicKey;

    constructor(obj: any) {
        this.poolAccount = obj.poolAccount;
        this.ammInfo = obj.ammInfo;
        this.ammAuthorityInfo = obj.ammAuthorityInfo;
        this.ammOpenOrderInfo = obj.ammOpenOrderInfo;
        this.ammTargetOrdersInfo = obj.ammTargetOrdersInfo;
        this.ammCoinVaultInfo = obj.ammCoinVaultInfo;
        this.ammPcVaultInfo = obj.ammPcVaultInfo;
        this.marketInfo = obj.marketInfo;
        this.marketBidsInfo = obj.marketBidsInfo;
        this.marketAsksInfo = obj.marketAsksInfo;
        this.marketEventQueueInfo = obj.marketEventQueueInfo;
        this.marketCoinVaultInfo = obj.marketCoinVaultInfo;
        this.marketPcVaultInfo = obj.marketPcVaultInfo;
        this.marketVaultSigner = obj.marketVaultSigner;
    }
}

const POOLS = [
    {
        poolAccount: new PublicKey('eC2Xy9jC3mQyBvwet5xTpqHva5WMyg1LvVWpC4t3vJa'),
        ammInfo: new PublicKey('A9z2G1UCHJYukBJAdpWd4WrVw4NMXR7ca7Jx3jtETW3W'),
        ammAuthorityInfo: new PublicKey('DbQqP6ehDYmeYjcBaMRuA8tAJY1EjDUz9DpwSLjaQqfC'),
        ammOpenOrderInfo: new PublicKey('BaVjNRyujy6ShfpZDpZLWjfPGviMsMhRQVCHbWfqNSfV'),
        ammTargetOrdersInfo: new PublicKey('99jsQCMPG8HW2TwhTXs1Rdz9C9vKLG9fB1aEP8uxeN92'),
        ammCoinVaultInfo: new PublicKey('DEGQyCdQTy8gsevEx563dtgEwiH6rrxSTiUrYJeftTmi'),
        ammPcVaultInfo: new PublicKey('6dVtJsejfYQvBAjUBFBVNZxFNac89oP7noYRVjFFAaUi'),
        marketInfo: new PublicKey('DZp9wmtPLGrUYqWMJ2a6JWtzqkub4pNmd4kHP4ULsZap'),
        marketBidsInfo: new PublicKey('34HBWJqawTeBtyCkJzTxKqS4nn2HEmhy7yo6TmnnpvnU'),
        marketAsksInfo: new PublicKey('BtiiRyHGAMmcw4D9aRNLf3kRL3DX1hu1TZJZSG53SUf'),
        marketEventQueueInfo: new PublicKey('HFgY7QXPdfY2NzQNKg7UhfqUawyBHFKTtVf6eBQkoqUm'),
        marketCoinVaultInfo: new PublicKey('2rjYzLfXd643DFAkqg4W7e4traUaD6CbJ44i2Y4zAWqF'),
        marketPcVaultInfo: new PublicKey('Gs69yWTxLQQRuX1EVkxmokRNryMdfUwsGDeJPa6EMeth'),
        marketVaultSigner: new PublicKey('6h3rytrC7GKnkmoyPKTp1jk2R4onp9LfadJWA9TXE1Rf'),

    }
];
const [globalConfigAccount, globalConfigBump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("global_config")
    ], 
    PROGRAM_ID,
);

const formatAmmKeysById = async(connection: Connection, id: string): Promise<ApiPoolInfoV4> => {
    const account = await connection.getAccountInfo(new PublicKey(id))
    if (account === null) throw Error(' get id info error ')
    const info = LIQUIDITY_STATE_LAYOUT_V4.decode(account.data)
  
  
    const marketId = info.marketId
    const marketAccount = await connection.getAccountInfo(marketId)
    if (marketAccount === null) throw Error(' get market info error')
    const marketInfo = MARKET_STATE_LAYOUT_V3.decode(marketAccount.data)
  
    const lpMint = info.lpMint
    const lpMintAccount = await connection.getAccountInfo(lpMint)
    if (lpMintAccount === null) throw Error(' get lp mint info error')
    const lpMintInfo = SPL_MINT_LAYOUT.decode(lpMintAccount.data)
  
    return {
      id,
      baseMint: info.baseMint.toString(),
      quoteMint: info.quoteMint.toString(),
      lpMint: info.lpMint.toString(),
      baseDecimals: info.baseDecimal.toNumber(),
      quoteDecimals: info.quoteDecimal.toNumber(),
      lpDecimals: lpMintInfo.decimals,
      version: 4,
      programId: account.owner.toString(),
      authority: Liquidity.getAssociatedAuthority({ programId: account.owner }).publicKey.toString(),
      openOrders: info.openOrders.toString(),
      targetOrders: info.targetOrders.toString(),
      baseVault: info.baseVault.toString(),
      quoteVault: info.quoteVault.toString(),
      withdrawQueue: info.withdrawQueue.toString(),
      lpVault: info.lpVault.toString(),
      marketVersion: 3,
      marketProgramId: info.marketProgramId.toString(),
      marketId: info.marketId.toString(),
      marketAuthority: Market.getAssociatedAuthority({ programId: info.marketProgramId, marketId: info.marketId }).publicKey.toString(),
      marketBaseVault: marketInfo.baseVault.toString(),
      marketQuoteVault: marketInfo.quoteVault.toString(),
      marketBids: marketInfo.bids.toString(),
      marketAsks: marketInfo.asks.toString(),
      marketEventQueue: marketInfo.eventQueue.toString(),
      lookupTableAccount: PublicKey.default.toString()
    }
  }

  const calculateAmountOut = async(connection: Connection, poolAccount: PublicKey, inputTokenAmount: TokenAmount, outputToken: Token) => {
    const targetPoolInfo = await formatAmmKeysById(connection, poolAccount.toString());
    const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys;
    const slippage = new Percent(1, 100);
    const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
        poolKeys: poolKeys,
        poolInfo: await Liquidity.fetchInfo({ connection, poolKeys }),
        amountIn: inputTokenAmount,
        currencyOut: outputToken,
        slippage: slippage,
    })
    return amountOut;
  }

const checkLiquition = (baseAmount: bigint, borrowAmount: bigint, liquitionRate: bigint) => {
    if (borrowAmount * liquitionRate / BigInt("1000000") > baseAmount) {
        return true;
    } else {
        return false;
    }
}

const liquitionPosition = async(
    poolAccountInfo: PoolAccountInfo,
    userPositionAccount: PublicKey,
) => {
    let poolAccount = poolAccountInfo.poolAccount;
    let poolInfo = await PROGRAM.account.poolInfo.fetch(poolAccount);
    // console.log(poolInfo);
    const baseTokenMint = await poolInfo.baseMint;
    const quoteTokenMint = await poolInfo.quoteMint;
    let poolTokenAccount = await getAssociatedTokenAddress(
        baseTokenMint,
        poolAccountInfo.poolAccount,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_PROGRAM_ID,
    )
    let userPositionInfo = await PROGRAM.account.userPositionInfo.fetch(userPositionAccount);
    console.log(userPositionInfo);
    const userPositionTokenAccountForBaseToken = await getAssociatedTokenAddress(
        baseTokenMint,
        userPositionAccount,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_PROGRAM_ID
    );
    let userPositionTokenAccountForQuoteToken = await getAssociatedTokenAddress(
        quoteTokenMint,
        userPositionAccount,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_PROGRAM_ID
    );

    let positionBaseTokenAmount = 0n;
    try {
        positionBaseTokenAmount = (await getAccount(connection, userPositionTokenAccountForBaseToken, undefined, TOKEN_PROGRAM_ID)).amount;
    } catch (err) {

    }
    let positionQuoteTokenAmount = 0n;
    try {
        positionQuoteTokenAmount = (await getAccount(connection, userPositionTokenAccountForQuoteToken, undefined, TOKEN_PROGRAM_ID)).amount;
    } catch (err) {

    }
    console.log(positionBaseTokenAmount, positionQuoteTokenAmount);
    if (positionQuoteTokenAmount > 0) {
        let inputToken = new Token(TOKEN_PROGRAM_ID, quoteTokenMint, 6, "", "");
        let inputTokenAmount = new TokenAmount(inputToken, positionQuoteTokenAmount);
        let outputToken = new Token(TOKEN_PROGRAM_ID, baseTokenMint, 6, '', '',);
        let outputTokenAmount = await calculateAmountOut(connection, poolAccountInfo.ammInfo, inputTokenAmount, outputToken);
        positionBaseTokenAmount += BigInt(outputTokenAmount.numerator.toString());
    }
    console.log(positionBaseTokenAmount);
    if (checkLiquition(positionBaseTokenAmount, BigInt(userPositionInfo.borrowAmount.toString()), BigInt(poolInfo.liquidationRate))) {
    // if (checkLiquition(positionBaseTokenAmount, BigInt(userPositionInfo.borrowAmount.toString()), BigInt(1000000))) {
        let tx = await PROGRAM.methods.liquitionPosition(
            ).accounts({
              keeper: wallet.publicKey,
              ammInfo: poolAccountInfo.ammInfo,
              ammAuthorityInfo: poolAccountInfo.ammAuthorityInfo,
              ammOpenOrderInfo: poolAccountInfo.ammOpenOrderInfo,
              ammTargetOrdersInfo: poolAccountInfo.ammTargetOrdersInfo,
              ammCoinVaultInfo: poolAccountInfo.ammCoinVaultInfo,
              ammPcVaultInfo: poolAccountInfo.ammPcVaultInfo,
              serumProgram,
              marketInfo: poolAccountInfo.marketInfo,
              marketBidsInfo: poolAccountInfo.marketBidsInfo,
              marketAsksInfo: poolAccountInfo.marketAsksInfo,
              marketEventQueueInfo: poolAccountInfo.marketEventQueueInfo,
              marketCoinVaultInfo: poolAccountInfo.marketCoinVaultInfo,
              marketPcVaultInfo: poolAccountInfo.marketPcVaultInfo,
              marketVaultSigner: poolAccountInfo.marketVaultSigner,
              raydiumAmmProgram,
              user: userPositionInfo.user,
              globalConfigInfo: globalConfigAccount,
              poolInfo: poolAccountInfo.poolAccount,
              userPositionInfo: userPositionAccount,
              userPositionInTokenAccount: userPositionTokenAccountForQuoteToken,
              userPositionOutTokenAccount: userPositionTokenAccountForBaseToken,
              coinTokenMint: quoteTokenMint,
              pcTokenMint: baseTokenMint,
              poolTokenAccount: poolTokenAccount,
            }).signers([
              keypair,
            // ]).rpc();
            ]).rpc({skipPreflight: true});
            console.log(tx);
    }



}

const work = async() => {
    for (let index in POOLS) {
        let poolAccountInfo = POOLS[index];
        let poolAccount = poolAccountInfo.poolAccount;
        let poolInfo = await PROGRAM.account.poolInfo.fetch(poolAccount);
        console.log(poolInfo);
        console.log(new PublicKey('11111111111111111111111111111111'));
        let zeroPubKey = new PublicKey('11111111111111111111111111111111');
        for (let i = 0; i < poolInfo.positions.length; i ++) {
            let position = poolInfo.positions[i];
            if (!position.equals(zeroPubKey)) {
                await liquitionPosition(poolAccountInfo, position);
            }
        }
        // let userPositionAccount = new PublicKey('G3ooxEG9E9XhipLVGSNMnf4K8rdUBoCFUc9DqXY7USjn');
        // await liquitionPosition(poolAccountInfo, userPositionAccount);
    }
}

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

(async() => {
    while (true) {
        await work();
        await delay(10000);
    }
})();
