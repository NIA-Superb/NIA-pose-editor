import React from 'react';
import { Theme } from '@material-ui/core/styles'
import { 
  IconButton,
  WithStyles,
  withStyles,
  createStyles,
  InputBase,
  Typography,
} from '@material-ui/core';

import {
  FirstPage,
  NavigateNext,
  NavigateBefore,
  LastPage,
} from '@material-ui/icons'
import _ from 'lodash';

const styles = (theme:Theme)=> createStyles({
  root: {
    display:'flex',
    alignItems:'center',
    position:'relative',
    [theme.breakpoints.up('sm')]: {
      width:'auto'
    },
    paddingLeft:'1em',
    paddingRight:'1em',
  },
  inputBox: {
    background:'rgba(255, 255, 255, 0.3)',
    '&:hover': {
      background:'rgba(255, 255, 255, 0.35)',
    },
    padding: theme.spacing(0.3, 0.3, 0.3, 0),
    paddingLeft: `calc(0.5em)`,
    borderRadius: theme.shape.borderRadius,
    width: '3em',
    color: 'inherit'
  },
  navigateButton: {
    background: 'rgba(0, 0, 0, 0.5)',
    width: theme.shape.borderRadius / 2,
    height: theme.shape.borderRadius / 2,
    borderRadius: theme.shape.borderRadius * 0.7,
    '&:hover' : {
      background: 'rgba(0, 0, 0, 0.2)',
    },
    marginLeft: theme.shape.borderRadius * 0.3,
    marginRight: theme.shape.borderRadius * 0.3,
  },
  navigateButtonGroup: {
    marginLeft: theme.shape.borderRadius,
    marginRight: theme.shape.borderRadius,
  },
  navtext: {
    align: 'center',
  }
});

export interface PaginatorProps extends WithStyles<typeof styles> {
  minPage: number
  maxPage: number
  currentPage: number
  onPageChange?: ((v:number)=>null)
}

export const Paginator = withStyles(styles)(
  class extends React.Component<PaginatorProps> {
    private inputRef = React.createRef<HTMLInputElement>();

    handleChange(elem: HTMLInputElement) {
      const onPageChange = this.props.onPageChange || ((_:number) => { });
      const oldValue = this.props.currentPage;
      try {
        let newValue = parseInt(elem.value);
        newValue = _.max([newValue, this.props.minPage])!
        newValue = _.min([newValue, this.props.maxPage])!
        if (newValue !== oldValue) {
          onPageChange(newValue);
        }
        elem.value = newValue.toString();
      } catch (e) {
        elem.value = oldValue.toString();
      }
    }

    handleFirstPageClick() {
      const onPageChange = this.props.onPageChange || ((_:number) => { });
      if (this.props.minPage !== this.props.currentPage) {
        onPageChange(this.props.minPage);
        this.inputRef.current!.value = this.props.minPage.toString();
      }
    }

    handleLastPageClick() {
      const onPageChange = this.props.onPageChange || ((_:number) => { });
      if (this.props.maxPage !== this.props.currentPage) {
        onPageChange(this.props.maxPage);
        this.inputRef.current!.value = this.props.maxPage.toString();
      }
    }

    handlePrevPageClick() {
      const onPageChange = this.props.onPageChange || ((_:number) => { });
      const nextPage = _.max([this.props.minPage, _.min([this.props.maxPage, this.props.currentPage - 1])!])!
      if (this.props.currentPage !== nextPage) {
        onPageChange(nextPage);
        this.inputRef.current!.value = nextPage.toString();
      }
    }

    handleNextPageClick() {
      const onPageChange = this.props.onPageChange || ((_:number) => { });
      const nextPage = _.max([this.props.minPage, _.min([this.props.maxPage, this.props.currentPage + 1])!])!
      if (this.props.currentPage !== nextPage) {
        onPageChange(nextPage);
        this.inputRef.current!.value = nextPage.toString();
      }
    }

    render() {
      const props = this.props;
      return (
        <div className={props.classes.root}>
          <Typography color="inherit" className={props.classes.navtext} variant='h6' display='initial'>
            {props.minPage}
          </Typography>
          <div className={props.classes.navigateButtonGroup}>
            <IconButton aria-label="first" className={props.classes.navigateButton} color="inherit" onClick={()=>{this.handleFirstPageClick()}}>
              <FirstPage fontSize="small" />
            </IconButton>
            <IconButton aria-label="before" className={props.classes.navigateButton} color="inherit" onClick={()=>{this.handlePrevPageClick()}}>
              <NavigateBefore fontSize="small" />
            </IconButton>
          </div>
          <InputBase className={props.classes.inputBox} 
            inputRef={this.inputRef}
            onKeyPress={(e:React.KeyboardEvent<HTMLInputElement>)=>{
              const key = e.key.charCodeAt(0);
              if (e.charCode === 0x0d || e.key === ' ') {
                e.preventDefault();
                this.handleChange(this.inputRef.current!);
                this.inputRef.current?.blur();
              }
              if (0x30 > key || key > 0x39) {
                e.preventDefault();
                this.handleChange(this.inputRef.current!);
              }
            }} 
            defaultValue = {props.currentPage}
            onBlur = {(e:React.FocusEvent<HTMLInputElement>)=>{ this.handleChange(this.inputRef.current!); }}
          />
          <div className={props.classes.navigateButtonGroup}>
            <IconButton aria-label="next" className={props.classes.navigateButton} color="inherit" onClick={()=>{this.handleNextPageClick()}}>
              <NavigateNext fontSize="small" />
            </IconButton>
            <IconButton aria-label="last" className={props.classes.navigateButton} color="inherit" onClick={()=>{this.handleLastPageClick()}}>
              <LastPage fontSize="small" />
            </IconButton>
          </div>
          <Typography color="inherit" className={props.classes.navtext} variant='h6' display='initial'>
            {props.maxPage}
          </Typography>
        </div>
      );
    }
  })

export default Paginator;