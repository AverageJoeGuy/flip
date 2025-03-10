import { Canvas } from '@react-three/fiber'
import { Gamba, LAMPORTS_PER_SOL, useGamba } from 'gamba'
import React, { useState } from 'react'
import { SetupGuide } from './SetupGuide'
import { BetInput } from './components/BetInput'
import { CoinFlip } from './components/CoinFlip'
import { DropdownMenu } from './components/DropdownMenu'
import { Header } from './components/Header'
import { Loading } from './components/Loading'
import { RecentGames } from './components/RecentGames'
import { Value } from './components/Value'
import { getConfig } from './config'
import { HEADS, MIN_WAGER, TAILS } from './constants'
import {
  Amount,
  Button,
  ButtonGroup,
  CanvasWrapper,
  Container,
  Controls,
  GlobalStyle,
  Info,
  Wrapper
} from './styles'

function Game() {
  const gamba = useGamba()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [wager, setWager] = useState(MIN_WAGER)
  const maxWager = gamba.house.maxPayout / 2
  const wagerIsValid = Number.isFinite(Number(wager)) && wager >= MIN_WAGER && wager <= maxWager
  const accountCreated = gamba.user.created
  const canPlay = accountCreated && !loading && wagerIsValid && gamba.user.status === 'playing'

  const play = async (game: number[]) => {
    try {
      const response = await gamba.play(game, wager * LAMPORTS_PER_SOL)
      setLoading(true)
      const result = await response.result()
      setResult(result.resultIndex)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <Header />
      <div>
        <CanvasWrapper>
          <Canvas linear flat camera={{ fov: 50 }}>
            <CoinFlip result={result} flipping={loading} />
          </Canvas>
        </CanvasWrapper>
        <Loading loading={loading} />
        <Wrapper>
          <Controls>
            <Info>
              <span>
                Balance: <Value children={`${(gamba.wallet.balance / LAMPORTS_PER_SOL).toFixed(2)} SOL`} />
              </span>
              <Amount $value={gamba.user.balance}>
                {gamba.user.created && <Value children={`+${(gamba.user.balance / LAMPORTS_PER_SOL).toFixed(6)}`} />}
              </Amount>
            </Info>
            <BetInput wager={wager} onChange={setWager} />
            {!gamba.connected ? (
              <Button $gradient onClick={() => gamba.connect()}>
                Connect
              </Button>
            ) : !gamba.user.created ? (
              <Button $gradient onClick={() => gamba.init()}>
                Create Gamba account
              </Button>
            ) : (
              <ButtonGroup>
                <Button disabled={!canPlay} onClick={() => play(HEADS)}>
                  Heads
                </Button>
                <Button disabled={!canPlay} onClick={() => play(TAILS)}>
                  Tails
                </Button>
                <DropdownMenu
                  label="..."
                  options={[
                    { label: 'Disconnect', onClick: () => gamba.disconnect() },
                    gamba.user.balance > 0 && { label: 'Claim', onClick: () => gamba.withdraw() },
                    { label: 'Close Account', onClick: () => confirm('You should only use this if you are unable to Claim. Are you sure? ') && gamba.close() },
                    { label: 'Debug State', onClick: () => alert(JSON.stringify(gamba.user, null, 2)) },
                  ]}
                />
              </ButtonGroup>
            )}
          </Controls>
          <RecentGames />
        </Wrapper>
      </div>
    </Container>
  )
}

export function App() {
  const config = getConfig()
  if (!config.creatorAddress || !config.rpcEndpoint) {
    return (
      <SetupGuide />
    )
  }
  return (
    <>
      <GlobalStyle />
      <Gamba
        name="Gamba Flip"
        creator={config.creatorAddress}
        connection={{
          endpoint: config.rpcEndpoint,
          config: {
            commitment: 'processed',
            wsEndpoint: config.rpcWsEndpoint,
          },
        }}
      >
        <Game />
      </Gamba>
    </>
  )
}
