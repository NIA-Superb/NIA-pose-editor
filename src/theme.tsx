import { red } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme ({
  palette: {
    primary: {
      main: '#3269a8'
    },
    secondary: {
      main: '#a83236'
    },
    error: {
      main: red.A400
    },
    background: {
      default: '#FFF'
    }
  }
});

export default theme;