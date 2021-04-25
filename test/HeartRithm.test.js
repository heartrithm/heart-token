const { BN, constants, expectEvent, expectRevert, ether } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const {
  shouldBehaveLikeERC20,
  shouldBehaveLikeERC20Transfer,
  shouldBehaveLikeERC20Approve,
  shouldBehaveLikeTokenRecover,
} = require('./HeartRithm.behavior');

const HeartRithm = artifacts.require('HeartRithm');

contract('HeartRithm', function (accounts) {
  const [ initialHolder, recipient, anotherAccount ] = accounts;

  const name = 'HeartRithm';
  const symbol = 'HEART';

  const initialSupply = ether('100');

  beforeEach(async function () {
    heart = await HeartRithm.new();
    await heart.mint(initialHolder, initialSupply);
  });

  it('has a name', async function () {
    expect(await heart.name()).to.equal(name);
  });

  it('has a symbol', async function () {
    expect(await heart.symbol()).to.equal(symbol);
  });

  it('has 18 decimals', async function () {
    expect(await heart.decimals()).to.be.bignumber.equal('18');
  });

  shouldBehaveLikeERC20('HeartRithm', initialSupply, initialHolder, recipient, anotherAccount);

  describe('_mint', function () {
    const amount = new BN(50);
    it('rejects a null account', async function () {
      await expectRevert(
        heart.mint(ZERO_ADDRESS, amount), 'HeartRithm: mint to the zero address',
      );
    });

    describe('for a non zero account', function () {
      beforeEach('minting', async function () {
        const { logs } = await heart.mint(recipient, amount);
        this.logs = logs;
      });

      it('only owner can mint tokent', async function () {
        await expectRevert(heart.mint(recipient, amount, { from: recipient }),
        'Ownable: caller is not the owner');
      });

      it('increments totalSupply', async function () {
        const expectedSupply = initialSupply.add(amount);
        expect(await heart.totalSupply()).to.be.bignumber.equal(expectedSupply);
      });

      it('increments recipient balance', async function () {
        expect(await heart.balanceOf(recipient)).to.be.bignumber.equal(amount);
      });

      it('emits Transfer event', async function () {
        const event = expectEvent.inLogs(this.logs, 'Transfer', {
          from: ZERO_ADDRESS,
          to: recipient,
        });

        expect(event.args.value).to.be.bignumber.equal(amount);
      });
    });
  });

  describe('_burn', function () {
    it('rejects a null account', async function () {
      await expectRevert(heart.burn(ZERO_ADDRESS, new BN(1)),
        'HeartRithm: burn from the zero address');
    });

    describe('for a non zero account', function () {
      it('rejects burning more than balance', async function () {
        await expectRevert(heart.burn(
          initialHolder, initialSupply.addn(1)), 'HeartRithm: burn amount exceeds balance',
        );
      });

      const describeBurn = function (description, amount) {
        describe(description, function () {
          beforeEach('burning', async function () {
            const { logs } = await heart.burn(initialHolder, amount);
            this.logs = logs;
          });

          it('only owner can burn tokent', async function () {
            await expectRevert(heart.burn(recipient, amount, { from: recipient }),
            'Ownable: caller is not the owner');
          });

          it('decrements totalSupply', async function () {
            const expectedSupply = initialSupply.sub(amount);
            expect(await heart.totalSupply()).to.be.bignumber.equal(expectedSupply);
          });

          it('decrements initialHolder balance', async function () {
            const expectedBalance = initialSupply.sub(amount);
            expect(await heart.balanceOf(initialHolder)).to.be.bignumber.equal(expectedBalance);
          });

          it('emits Transfer event', async function () {
            const event = expectEvent.inLogs(this.logs, 'Transfer', {
              from: initialHolder,
              to: ZERO_ADDRESS,
            });

            expect(event.args.value).to.be.bignumber.equal(amount);
          });
        });
      };

      describeBurn('for entire balance', initialSupply);
      describeBurn('for less amount than balance', initialSupply.subn(1));
    });
  });

  describe('_transfer', function () {
    shouldBehaveLikeERC20Transfer('HeartRithm', initialHolder, recipient, initialSupply, function (from, to, amount) {
      return heart.transfer(from, to, amount);
    });
  });

  describe('_approve', function () {
    shouldBehaveLikeERC20Approve('HeartRithm', initialHolder, recipient, initialSupply, function (owner, spender, amount) {
      return heart.approve(owner, spender, amount);
    });
  });

  describe('Token recover', function () {
    shouldBehaveLikeTokenRecover(initialHolder, recipient);
  });
});