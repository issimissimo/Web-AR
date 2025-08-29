import { createEffect, createSignal, onMount, useContext } from 'solid-js';
import { config } from '@js/config';
import { styled } from 'solid-styled-components';

import { Context } from '@views/ar-overlay/arSession';
import { AppMode } from '@/main';

import GAMES_LIST from '@plugin';


export default function MainUI(props) {

    const context = useContext(Context);

    const getGamesAvailableByName = (gameName) => {
        const gameSpecs = GAMES_LIST.find(g => g.fileName === gameName);
        const totalAllowed = gameSpecs.allowed;
        let nGames = 0;
        if (props.marker.games) {
            props.marker.games.map(game => {
                if (game.name === gameName) nGames++;
            });
            return totalAllowed - nGames;
        }
        return totalAllowed;
    }


    const Container = styled('div')`
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        /* align-items: center;
        justify-content: center; */
    `;


    const Button = styled('button')`
        opacity: ${props => props.enabled ? 1 : 0.2};
        pointer-events: ${props => props.enabled ? 'auto' : 'none'};
        height: 40px;
    `;




    const Inventory = () => {
        return (
            <>
                <p>INVENTORY</p>

                {
                    GAMES_LIST.map(gameSpecs => (
                        <Button
                            onClick={() => props.addNewModule("temporaryModuleID", gameSpecs.fileName)}
                            enabled={getGamesAvailableByName(gameSpecs.fileName) > 0 ? true : false}
                        >{gameSpecs.title}</Button>
                    ))
                }

                <Button
                    onClick={props.saveGame}
                    enabled={props.saveEnabled}
                >SAVE GAME</Button>

            </>
        )
    }


    


    const renderView = () => {

        switch (context.appMode) {

            case AppMode.SAVE:
                return <Inventory/>;

            case AppMode.LOAD:
                return <div></div>


        }
    };



    return (
        <Container>
           {renderView()}
        </Container>
    )
}