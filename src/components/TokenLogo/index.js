
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { default as CSPR, default as EthereumLogo } from '../../assets/cspr.png'
import { tokens } from './TokenLogoHelper/tokenDetails.js'

const BAD_IMAGES = {}

const Inline = styled.div`
  display: flex;
  align-items: center;
  align-self: center;
`

const Image = styled.img`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background-color: white;
  border-radius: 50%;
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
`

const StyledEthereumLogo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  > img {
    width: ${({ size }) => size};
    height: ${({ size }) => size};
  }
`

const StyledCSPR = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  > img {
    width: ${({ size }) => size};
    height: ${({ size }) => size};
  }
`

export default function TokenLogo({ address, symbol, header = false, size = '24px', ...rest }) {
  console.log("symbolsymbol", symbol);
  const [error, setError] = useState(false)
  // const myList = generateMyTokenList();
  // console.log("TokenList", TokenList);
  useEffect(() => {
    setError(false)
  }, [address])

  if (error || BAD_IMAGES[address]) {
    return (
      <Inline>
        {/* <span {...rest} alt={''} style={{ fontSize: size }} role="img" aria-label="face"> */}
        <StyledCSPR size={size} {...rest}>
          <img
            src={CSPR}
            style={{
              boxShadow: '0px 6px 10px rgba(0, 0, 0, 0.075)',
              borderRadius: '24px',
            }}
            alt=""
          />
        </StyledCSPR>
        {/* </span> */}
      </Inline>
    )
  }

  // hard coded fixes for trust wallet api issues
  if (address?.toLowerCase() === '0x5e74c9036fb86bd7ecdcb084a0673efc32ea31cb') {
    address = '0x42456d7084eacf4083f1140d3229471bba2949a8'
  }

  if (address?.toLowerCase() === '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f') {
    address = '0xc011a72400e58ecd99ee497cf89e3775d4bd732f'
  }

  if (address?.toLowerCase() === '0885c63f5f25ec5b6f3b57338fae5849aea5f1a2c96fc61411f2bfc5e432de5a') {
    return (
      <StyledEthereumLogo size={size} {...rest}>
        <img
          src={EthereumLogo}
          style={{
            boxShadow: '0px 6px 10px rgba(0, 0, 0, 0.075)',
            borderRadius: '24px',
          }}
          alt=""
        />
      </StyledEthereumLogo>
    )
  }

  // const path = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address
  //   }/logo.png`
  let index = tokens.findIndex(x => x.symbol === symbol);
  console.log("indexindex", index);
  return (
    <Inline>
      <Image
        {...rest}
        alt={''}
        src={index == -1 ? CSPR : tokens[index].logoURI}
        size={size}
        onError={(event) => {
          BAD_IMAGES[address] = true
          setError(true)
          event.preventDefault()
        }}
      />
    </Inline>
  )
}
