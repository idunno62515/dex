import * as networkService from "./services/networkService";
import EnvConfig from "./configs/env";

$(function () {

  const numberRegex = /^\s*[+-]?(\d+|\.\d+|\d+\.\d+|\d+\.)(e[+-]?\d+)?\s*$/
  const isValidNumber = function (s) {
    return numberRegex.test(s);
  };

  let exChangeRate = 0;

  initiateProject();

  function initiateProject() {
    const defaultSrcSymbol = EnvConfig.TOKENS[0].symbol;
    const defaultDestSymbol = EnvConfig.TOKENS[1].symbol;

    initiateDropdown();
    initiateSelectedToken(defaultSrcSymbol, defaultDestSymbol);
    initiateDefaultRate(defaultSrcSymbol, defaultDestSymbol);
    initBalances();
    getAccount();
  }

  setInterval(() => {
    initBalances();
    console.log("5s");
  }, 10000)

  if (window.ethereum) {
    window.ethereum.on('accountsChanged', accounts => {
      window.location.reload();
    })
  }

  function getAccount() {
    networkService.getAccountAddress()
      .then(res => {
        console.log(res);
        $('#account__address').text('Account : ' + res[0])
      }).catch(err => {
        console.log(err);
      })
  }

  function initiateDropdown() {
    let dropdownTokens = '';

    EnvConfig.TOKENS.forEach((token) => {
      dropdownTokens += `<div class="dropdown__item">${token.symbol}</div>`;
    });

    $('.dropdown__content').html(dropdownTokens);
  }

  function approve(token) {

  }

  function initiateSelectedToken(srcSymbol, destSymbol) {
    $('#selected-src-symbol').html(srcSymbol);
    $('#selected-dest-symbol').html(destSymbol);
    $('#rate-src-symbol').html(srcSymbol);
    $('#rate-dest-symbol').html(destSymbol);
    $('#selected-transfer-token').html(srcSymbol);
  }

  function initBalances() {
    networkService.getTokenBalances(EnvConfig.TOKENS[0].address)
      .then((result) => {
        const balance = result / Math.pow(10, 18);
        $('#balance__tka').html('token a : ' + balance);
      }).catch(error => {
        console.log(error);
        $('#balance__tka').html('token a : ' + 0);
      })
    networkService.getTokenBalances(EnvConfig.TOKENS[1].address)
      .then((result) => {
        const balance = result / Math.pow(10, 18);
        $('#balance__tkb').html('token b : ' + balance);
      }).catch(error => {
        console.log(error);
        $('#balance__tkb').html('token b : ' + 0);
      })

    networkService.getTokenBalances(EnvConfig.TOKENS[2].address)
      .then((result) => {
        const balance = result / Math.pow(10, 18);
        $('#balance__eth').html('ether : ' + balance);
      }).catch(error => {
        console.log(error);
        $('#balance__eth').html('ether : ' + 0);
      })
  }

  function initiateDefaultRate(srcSymbol, destSymbol) {

    const value = $('#swap-source-amount').val();
    if (srcSymbol == destSymbol) {
      $('#exchange-rate').html(1);
      exChangeRate = 1;
      if (isValidNumber(value)) {
        $('.input-placeholder').html(exChangeRate * value);
      }
      return;
    }


    const srctoken = findTokenBySymbol(srcSymbol);
    const desttoken = findTokenBySymbol(destSymbol);


    const defaultSrcAmount = (Math.pow(10, 18)).toString();

    networkService.getExchangeRate(srctoken.address, desttoken.address, defaultSrcAmount)
      .then((result) => {
        const rate = result / Math.pow(10, 18);
        $('#exchange-rate').html(rate);
        exChangeRate = rate;
        if (isValidNumber(value)) {
          $('.input-placeholder').html(exChangeRate * value);
        }
      }).catch((error) => {
        console.log(error);
        $('#exchange-rate').html(0);
        exChangeRate = 0;
        if (isValidNumber(value)) {
          $('.input-placeholder').html(exChangeRate * value);
        }
      });
  }


  function swapToken(srcToken, destToken, value) {
    networkService.swapToken(srcToken, destToken, value)
      .then(res => {
        console.log(res);
        initBalances();
      }).catch(err => {
        console.log(err);
      })
  }

  function findTokenBySymbol(symbol) {
    return EnvConfig.TOKENS.find(token => token.symbol === symbol);
  }

  $(document).on('click', '.swap__icon', function () {
    const srctoken = $('#selected-src-symbol').text();
    const desttoken = $('#selected-dest-symbol').text();
    initiateSelectedToken(desttoken, srctoken);
    initiateDefaultRate(desttoken, srctoken);
  })

  // on changing token from dropdown.
  $(document).on('click', '.dropdown__item', function (event) {
    const selectedsymbol = $(this).html();
    const selectedtarget = $(this).parent().siblings('.dropdown__trigger').find('.selected-target');
    if (selectedtarget.attr('id') == 'selected-transfer-token') {
      $('#selected-transfer-token').text(selectedsymbol);
      return;
    }
    $(selectedtarget).text(selectedsymbol);
    /* todo: implement changing rate for source and dest token here. */
    const srctoken = $('#selected-src-symbol').text();
    const desttoken = $('#selected-dest-symbol').text();
    initiateSelectedToken(srctoken, desttoken);
    initiateDefaultRate(srctoken, desttoken);



  });


  $('#button__approve').on('click', function () {
    const srcTokenSym = $('#selected-src-symbol').text();
    const srcToken = findTokenBySymbol(srcTokenSym);
    networkService.approval(srcToken.address)
      .then(res => {
        console.log(res);

      })
      .catch(error => {
        alert(error);
      })
  });

  // import metamask
  $('#import-metamask').on('click', function () {
    /* todo: importing wallet by metamask goes here. */
    if (window.ethereum) {
      window.ethereum.enable();
    }
  });

  // handle on source amount changed
  $('#swap-source-amount').on('input change', function () {
    /* todo: fetching latest rate with new amount */
    const value = $(this).val();
    if (!isValidNumber(value) && value != '') {
      $('.input-error__swap').text('invalid number.')
      return;
    } else {
      $('.input-error__swap').text('')
      /* todo: updating dest amount */
      // const srcTokenSym = $('#selected-src-symbol').text();
      // const destTokenSym = $('#"selected-dest-symbol').text();
      const value = $('#swap-source-amount').val();
      $('.input-placeholder').html(exChangeRate * value)

    }



  });

  $('#transfer-source-amount').on('input change', function () {
    /* TODO: Fetching latest rate with new amount */
    const value = $(this).val();
    if (!isValidNumber(value) && value != '') {
      $('.input-error__transfer-value').text('Invalid number.')
      return;
    } else {
      $('.input-error__transfer-value').text('')
      /* TODO: Updating dest amount */

    }

  });

  $('#transfer-address').on('input change', function () {
    const address = $(this).val();
    networkService.checkValidAddress(address)
      .then(res => {
        if (res) {
          $('.input-error__transfer-address').text('')
        } else {
          $('.input-error__transfer-address').text('Invalid address.')
        }
      })


  })

  // handle on click token in token dropdown list
  $('.dropdown__item').on('click', function () {
    $(this).parents('.dropdown').removeClass('dropdown--active');
  });
  // handle on swap now button clicked
  $('#swap-button').on('click', function () {
    // const modalid = $(this).data('modal-id');
    // $(`#${modalid}`).addClass('modal--active');

    const srcTokenSym = $('#selected-src-symbol').text();
    const destTokenSym = $('#selected-dest-symbol').text();
    const value = $('#swap-source-amount').val();
    const srcToken = findTokenBySymbol(srcTokenSym);
    const destToken = findTokenBySymbol(destTokenSym);

    if (srcToken.address != EnvConfig.TOKENS[2].address) {
      networkService.checkApprove(srcToken.address)
        .then(isApproved => {
          if (isApproved) {
            //do transaction
            networkService.getTokenBalances(srcToken.address)
              .then(res => {
                if (value * Math.pow(10, 18) > res) {
                  const modal = $('#confirm-swap-modal');
                  modal.find('.modal__content')
                    .text('You do not have enough Token')
                    .css('color', 'red');
                  modal.addClass('modal--active');
                  return;
                }
                swapToken(srcToken, destToken, Number(value))
              }).catch(error => {
                console.log(error);
              })

          } else {
            //approve
            const modal = $('#confirm-swap-modal');
            const approveModal = $('.modal-approve');
            modal.find('.modal__content')
              .html(approveModal);

            modal.addClass('modal--active');
            return;
          }
        })
        .catch(error => {
          //handle error
          console.log(error);
        })
    }


  });

  // tab processing
  $('.tab__item').on('click', function () {
    const contentid = $(this).data('content-id');
    $('.tab__item').removeClass('tab__item--active');
    $(this).addClass('tab__item--active');
    if (contentid === 'swap') {
      $('#swap').addClass('active');
      $('#transfer').removeClass('active');
    } else {
      $('#transfer').addClass('active');
      $('#swap').removeClass('active');
    }
  });

  // dropdown processing
  $('.dropdown__trigger').on('click', function () {
    $(this).parent().toggleClass('dropdown--active');
  });

  // close modal
  $('.modal').on('click', function (e) {
    if (e.target !== this) return;
    $(this).removeClass('modal--active');
  });

  $('#btn-transfer').on('click', function () {
    const tokenSym = $('#selected-transfer-token').text();
    const value = Number($('#transfer-source-amount').val());
    const destAddress = $('#transfer-address').val();
    const token = findTokenBySymbol(tokenSym);

    networkService.getTokenBalances(token.address)
      .then(res => {
        if (value * Math.pow(10, 18) > res) {
          const modal = $('#confirm-transfer-modal');
          modal.find('.modal__content')
            .text('You do not have enough Token')
            .css('color', 'red');

          modal.addClass('modal--active');
          return;
        }
        networkService.transferToken(token.address, destAddress, value)
          .then(res => {
            console.log(res);
          }).catch(err => {
            console.log(err);
          })
      }).catch(error => {
        console.log(error);
      })



  })


  function getBalanceByToken(token) {

  }

})
