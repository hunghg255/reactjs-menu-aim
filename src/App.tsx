import './App.css';
import Menu from './Menu/Menu';
import GitHubCorners from 'react-gh-corners';

function App() {
  return (
    <div className='App'>
      <Menu />
      <GitHubCorners position='right' href='https://github.com/hunghg255/reactjs-menu-aim' />

    </div>
  );
}

export default App;
