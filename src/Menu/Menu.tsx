import React, { useEffect, useRef, useState } from 'react';
import { menuAim } from './menuAim';

const list = [
  {
    id: 1,
    name: 'foo',
    child: [
      {
        name: 'foo child',
      },
    ],
  },
  {
    id: 2,
    name: 'bazz',
    child: [
      {
        name: 'bazz child',
      },
    ],
  },
  {
    id: 3,
    name: 'fizzz',
    child: [
      {
        name: 'fizz child',
      },
    ],
  },
  {
    id: 4,
    name: 'fizzz4',
    child: [
      {
        name: 'fizz4 child',
      },
    ],
  },
  {
    id: 5,
    name: 'fizzz5',
    child: [
      {
        name: 'fizz5 child',
      },
    ],
  },
  {
    id: 6,
    name: 'fizzz6',
    child: [
      {
        name: 'fizz6 child',
      },
    ],
  },
  {
    id: 7,
    name: 'fizzz7',
    child: [
      {
        name: 'fizz7 child',
      },
    ],
  },
];

const Menu = () => {
  const [itemActive, setItemActive] = useState<any>();
  const refMenu: any = useRef();
  useEffect(() => {
    refMenu.current = menuAim({
      submenuDirection: 'right',
      menuContainer: '.menu-container',
      menuSelector: '.menu-aim',
      delay: 350,
      tolerance: 30,
      classItemActive: 'menu-aim__item--active',
      classPopup: '.menu-aim__item-submenu',
      classPopupActive: 'menu-aim__item-submenu--active',
    });
  }, []);

  const onSetItemActive = (it: any) => {
    it?.evt?.target?.classList?.add('menu-aim__item--active');
    setItemActive(it.item);
  };

  const onMouseEnter = (item: any) => (evt: any) => {
    if (refMenu.current?.handleMouseEnterRow)
      refMenu.current?.handleMouseEnterRow({ item, evt }, onSetItemActive);
  };

  return (
    <div className='menu-container right'>
      <ul className='menu-aim'>
        {list.map((it, idx: number) => {
          return (
            <li
              key={idx}
              className={`menu-aim__item ${
                itemActive?.id === it.id ? 'menu-aim__item--active' : ''
              }`}
              onMouseEnter={onMouseEnter(it)}
            >
              {it.name}
            </li>
          );
        })}
      </ul>
      <ul className='menu-aim__item-submenu'>
        {itemActive?.child?.map((it: any, idx: any) => {
          return <li key={idx}>{it.name}</li>;
        })}
      </ul>
    </div>
  );
};

export default Menu;
