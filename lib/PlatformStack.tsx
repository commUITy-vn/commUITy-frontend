/**
 * PlatformStack — web version.
 *
 * Uses `@react-navigation/stack` (JS stack). Sets cardStyleInterpolator
 * explicitly so every push gets the slide_from_right animation.
 */

import { withLayoutContext } from "expo-router"
import {
    createStackNavigator,
    CardStyleInterpolators,
} from "@react-navigation/stack"

const { Navigator } = createStackNavigator()

const forcedAnimation = {
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
}

const WebStackNavigator = withLayoutContext(Navigator)

const { Screen } = require("expo-router/build/views/Screen")
;(WebStackNavigator as any).Screen = Screen

export { WebStackNavigator as Stack, forcedAnimation }
export default WebStackNavigator
